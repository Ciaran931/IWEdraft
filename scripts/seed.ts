import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join } from 'path'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in environment.')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// ============================================================
// FILE READING HELPERS
// ============================================================

const DATA_DIR = join(__dirname, '..', 'data')
const TEXTS_DIR = join(DATA_DIR, 'texts')
const VOCAB_DIR = join(DATA_DIR, 'vocab')
const GRAMMAR_DIR = join(DATA_DIR, 'grammar')

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf-8'))
}

function getTextDirs(): string[] {
  if (!existsSync(TEXTS_DIR)) return []
  return readdirSync(TEXTS_DIR).filter(d =>
    existsSync(join(TEXTS_DIR, d, `${d}.json`))
  )
}

// ============================================================
// VOCAB WORD MERGING
// ============================================================

interface VocabWordEntry {
  id: string
  word: string
  pos: string
  en_definition: string
  examples: string[]
  trigger_words?: string[]
  translations: Record<string, { word: string; definition: string }>
}

function collectAllVocabWords(): VocabWordEntry[] {
  const seen = new Map<string, VocabWordEntry>()

  // 1. Load base/global vocab first (these take priority)
  const basePath = join(VOCAB_DIR, 'base-words.json')
  if (existsSync(basePath)) {
    const baseWords: VocabWordEntry[] = readJson(basePath)
    for (const w of baseWords) {
      seen.set(w.id, w)
    }
  }

  // 2. Merge per-text vocab (new words only, skip duplicates)
  for (const textDir of getTextDirs()) {
    const wordsPath = join(TEXTS_DIR, textDir, `${textDir}.words.json`)
    if (!existsSync(wordsPath)) continue
    const words: VocabWordEntry[] = readJson(wordsPath)
    for (const w of words) {
      if (!seen.has(w.id)) seen.set(w.id, w)
    }
  }

  return Array.from(seen.values())
}

// ============================================================
// TEXT QUESTIONS TRANSFORMATION
// ============================================================

interface ComprehensionQuestion {
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

interface QuestionsFile {
  text_id: string
  comprehension: ComprehensionQuestion[]
  discussion: string[]
}

interface TextQuestionRow {
  id: string
  text_id: string
  question_type: 'comprehension' | 'discussion'
  question: string
  options: string[] | null
  correct_index: number | null
  explanation: string | null
  sort_order: number
}

function collectAllTextQuestions(): TextQuestionRow[] {
  const rows: TextQuestionRow[] = []

  for (const textDir of getTextDirs()) {
    const qPath = join(TEXTS_DIR, textDir, `${textDir}.questions.json`)
    if (!existsSync(qPath)) continue
    const data: QuestionsFile = readJson(qPath)

    if (data.comprehension) {
      data.comprehension.forEach((q, i) => {
        rows.push({
          id: `${data.text_id}-c${i + 1}`,
          text_id: data.text_id,
          question_type: 'comprehension',
          question: q.question,
          options: q.options,
          correct_index: q.correct_index,
          explanation: q.explanation,
          sort_order: i + 1,
        })
      })
    }

    if (data.discussion) {
      data.discussion.forEach((q, i) => {
        rows.push({
          id: `${data.text_id}-d${i + 1}`,
          text_id: data.text_id,
          question_type: 'discussion',
          question: q,
          options: null,
          correct_index: null,
          explanation: null,
          sort_order: i + 1,
        })
      })
    }
  }

  return rows
}

// ============================================================
// SEED FUNCTION
// ============================================================
async function seed() {
  console.log('Seeding database...\n')

  // --- Vocab Words ---
  console.log('Inserting vocab_words...')
  const vocabWords = collectAllVocabWords()
  if (vocabWords.length > 0) {
    const { error: vocabError } = await supabase
      .from('vocab_words')
      .upsert(vocabWords, { onConflict: 'id' })
    if (vocabError) console.error('vocab_words error:', vocabError.message)
    else console.log(`  ${vocabWords.length} words inserted`)
  } else {
    console.log('  No vocab words found')
  }

  // --- Texts ---
  console.log('Inserting texts...')
  const textDirs = getTextDirs()
  for (const textDir of textDirs) {
    const text = readJson(join(TEXTS_DIR, textDir, `${textDir}.json`))
    const { error } = await supabase
      .from('texts')
      .upsert(text, { onConflict: 'id' })
    if (error) console.error(`  texts error (${textDir}):`, error.message)
  }
  console.log(`  ${textDirs.length} texts inserted`)

  // --- Text Translations ---
  console.log('Inserting text_translations...')
  for (const textDir of textDirs) {
    const transPath = join(TEXTS_DIR, textDir, `${textDir}.pl.json`)
    if (!existsSync(transPath)) continue
    const trans = readJson(transPath)
    const { error } = await supabase
      .from('text_translations')
      .upsert(trans, { onConflict: 'text_id,language_code' })
    if (error) console.error(`  text_translations error (${textDir}):`, error.message)
  }
  console.log(`  ${textDirs.length} translations inserted`)

  // --- Text Word Overrides ---
  console.log('Inserting text_word_overrides...')
  let overrideCount = 0
  for (const textDir of textDirs) {
    const overridesPath = join(TEXTS_DIR, textDir, `${textDir}.overrides.json`)
    if (!existsSync(overridesPath)) continue
    const overrides: Array<Record<string, unknown>> = readJson(overridesPath)
    if (overrides.length === 0) continue
    const { error } = await supabase
      .from('text_word_overrides')
      .upsert(overrides, { onConflict: 'text_id,word_id' })
    if (error) console.error(`  text_word_overrides error (${textDir}):`, error.message)
    else overrideCount += overrides.length
  }
  console.log(`  ${overrideCount} overrides inserted`)

  // --- Text Questions ---
  console.log('Inserting text_questions...')
  const textQuestions = collectAllTextQuestions()
  if (textQuestions.length > 0) {
    const { error: questionsError } = await supabase
      .from('text_questions')
      .upsert(textQuestions, { onConflict: 'id' })
    if (questionsError) console.error('text_questions error:', questionsError.message)
    else console.log(`  ${textQuestions.length} text questions inserted`)
  } else {
    console.log('  No text questions found (empty placeholders)')
  }

  // --- Grammar Lessons ---
  console.log('Inserting grammar_lessons...')
  const lessonsPath = join(GRAMMAR_DIR, 'lessons.json')
  if (existsSync(lessonsPath)) {
    const lessons = readJson<Array<Record<string, unknown>>>(lessonsPath)
    const { error: lessonError } = await supabase
      .from('grammar_lessons')
      .upsert(lessons, { onConflict: 'id' })
    if (lessonError) console.error('grammar_lessons error:', lessonError.message)
    else console.log(`  ${lessons.length} lessons inserted`)
  }

  // --- Grammar Questions ---
  console.log('Inserting grammar_questions...')
  const grammarQPath = join(GRAMMAR_DIR, 'questions.json')
  if (existsSync(grammarQPath)) {
    const grammarQs = readJson<Array<Record<string, unknown>>>(grammarQPath)
    const { error: questionError } = await supabase
      .from('grammar_questions')
      .upsert(grammarQs, { onConflict: 'id' })
    if (questionError) console.error('grammar_questions error:', questionError.message)
    else console.log(`  ${grammarQs.length} grammar questions inserted`)
  }

  console.log('\nSeed complete!')
}

seed().catch(err => {
  console.error('Seed failed:', err)
  process.exit(1)
})
