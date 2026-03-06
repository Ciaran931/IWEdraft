export interface User {
  id: string
  email: string
  language_code: string
  level: string | null
  streak_days: number
  last_active_at: string
}

export interface VocabWord {
  id: string
  word: string
  pos: string
  en_definition: string
  examples: string[]
  trigger_words?: string[]
  translations: Record<string, { word: string; definition: string }>
}

export interface TextWordOverride {
  text_id: string
  word_id: string
  en_definition: string
  translations: Record<string, { word: string; definition: string }>
}

export interface TextParagraph {
  id: number
  sentences: string[]
}

export interface Text {
  id: string
  title: string
  level: string
  category: 'graded' | 'immersion'
  grammar_lesson_id?: string
  paragraphs: TextParagraph[]
}

export interface TextTranslation {
  text_id: string
  language_code: string
  paragraphs: TextParagraph[]
}

export interface SrsCard {
  id: string
  user_id: string
  card_type: 'vocab' | 'grammar'
  content_id: string
  deck_id: string
  ease_factor: number
  interval: number
  repetitions: number
  due_date: string
  last_reviewed_at: string | null
  status: 'new' | 'learning' | 'review' | 'mature'
  source_text_id?: string
  source_sentence?: string
  context_definition?: string
  created_at: string
  // Joined fields
  vocab_words?: VocabWord
  grammar_questions?: GrammarQuestion
}

export interface SrsDeck {
  id: string
  user_id: string | null
  name: string
  deck_type: 'premade' | 'custom' | 'grammar' | 'niche'
  language_code: string
  is_locked: boolean
}

export type ExplanationBlock =
  | { type: 'text'; content: string }
  | { type: 'example'; english: string; translation: string }
  | { type: 'rule'; content: string }

export interface GrammarLesson {
  id: string
  title: string
  level: string
  category: string
  order: number
  explanation: ExplanationBlock[]
}

export interface GrammarQuestion {
  id: string
  lesson_id: string
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

export interface GrammarTreeLeaf {
  type: 'leaf'
  id: string
  label: string
}

export interface GrammarTreeCategory {
  type: 'category'
  label: string
  children: (GrammarTreeLeaf | GrammarTreeCategory)[]
}

export interface GrammarTreeLevel {
  level: string
  children: GrammarTreeCategory[]
}

export interface TextQuestion {
  id: string
  text_id: string
  question_type: 'comprehension' | 'discussion'
  question: string
  options: string[] | null
  correct_index: number | null
  explanation: string | null
  sort_order: number
}

export type Rating = 0 | 1 | 2 | 3

export interface CardStatusMap {
  [lessonId: string]: 'new' | 'learning' | 'review' | 'mature' | undefined
}
