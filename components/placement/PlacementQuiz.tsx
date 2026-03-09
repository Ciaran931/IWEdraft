'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { PLACEMENT_QUESTIONS, type PlacementQuestion } from '@/lib/placement-questions'
import { GRAMMAR_TREE } from '@/lib/grammar-tree'

function getLevelForScore(score: number, total: number): string {
  const pct = score / total
  if (pct < 0.2) return 'A1'
  if (pct < 0.4) return 'A2'
  if (pct < 0.6) return 'B1'
  if (pct < 0.8) return 'B2'
  return 'C1'
}

/** Get all grammar lesson IDs at or below the given level */
function getLessonIdsBelowLevel(level: string): string[] {
  const order = ['A1', 'A2', 'B1', 'B2', 'C1']
  const idx = order.indexOf(level)
  if (idx <= 0) return []

  const ids: string[] = []
  for (const lvl of GRAMMAR_TREE) {
    if (order.indexOf(lvl.level) >= idx) continue
    for (const cat of lvl.children) {
      for (const child of cat.children) {
        if (child.type === 'leaf') ids.push(child.id)
      }
    }
  }
  return ids
}

export default function PlacementQuiz({ userId }: { userId: string }) {
  const supabase = createClient()
  const router = useRouter()
  const [idx, setIdx] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<string | null>(null)

  const q: PlacementQuestion = PLACEMENT_QUESTIONS[idx]

  function handleAnswer(optIdx: number) {
    if (answered) return
    setSelected(optIdx)
    setAnswered(true)
    if (optIdx === q.correctIndex) setScore(s => s + 1)
  }

  async function handleNext() {
    if (idx + 1 < PLACEMENT_QUESTIONS.length) {
      setIdx(i => i + 1)
      setSelected(null)
      setAnswered(false)
    } else {
      // Quiz complete
      setSaving(true)
      const finalScore = selected === PLACEMENT_QUESTIONS[idx].correctIndex ? score + 1 : score
      const level = getLevelForScore(finalScore, PLACEMENT_QUESTIONS.length)

      // Update user level
      await supabase.from('users').update({ level }).eq('id', userId)

      // Mark lower-level grammar as mature with staggered due dates
      const lessonIds = getLessonIdsBelowLevel(level)
      if (lessonIds.length > 0) {
        // Get or create grammar deck
        let deckId: string
        const { data: existingDeck } = await supabase
          .from('srs_decks')
          .select('id')
          .eq('user_id', userId)
          .eq('deck_type', 'grammar')
          .maybeSingle()

        if (existingDeck) {
          deckId = existingDeck.id
        } else {
          const { data: newDeck } = await supabase
            .from('srs_decks')
            .insert({
              user_id: userId,
              name: 'Grammar Reviews',
              deck_type: 'grammar',
              language_code: 'en',
            })
            .select('id')
            .single()
          if (!newDeck) { setSaving(false); return }
          deckId = newDeck.id
        }

        // Check which lessons already have cards
        const { data: existingCards } = await supabase
          .from('srs_cards')
          .select('content_id')
          .eq('user_id', userId)
          .eq('card_type', 'grammar')
          .in('content_id', lessonIds)

        const existingSet = new Set(existingCards?.map(c => c.content_id) ?? [])
        const newLessons = lessonIds.filter(id => !existingSet.has(id))

        if (newLessons.length > 0) {
          const cards = newLessons.map((lessonId, i) => {
            // Stagger due dates: spread over next 14 days
            const due = new Date()
            due.setDate(due.getDate() + Math.floor(Math.random() * 14) + 1)
            return {
              user_id: userId,
              card_type: 'grammar' as const,
              content_id: lessonId,
              deck_id: deckId,
              ease_factor: 2.5,
              interval: 21 + Math.floor(Math.random() * 10),
              repetitions: 3,
              due_date: due.toISOString(),
              status: 'mature' as const,
            }
          })
          await supabase.from('srs_cards').insert(cards)
        }
      }

      setSaving(false)
      setResult(level)
    }
  }

  if (result) {
    return (
      <div className="bg-surface border border-border rounded-xl p-8 text-center">
        <p className="font-serif text-2xl mb-2">Your level: {result}</p>
        <p className="text-muted text-sm mb-6">
          Lower-level grammar has been marked as known. You can always review it from the grammar page.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="bg-terracotta text-white px-5 py-2 rounded font-medium hover:bg-terracotta-light transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    )
  }

  return (
    <div className="bg-surface border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-muted uppercase tracking-wide">{q.level}</span>
        <span className="text-xs text-muted">{idx + 1} / {PLACEMENT_QUESTIONS.length}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-border rounded-full h-1.5 mb-6">
        <div
          className="bg-terracotta h-1.5 rounded-full transition-all"
          style={{ width: `${(idx / PLACEMENT_QUESTIONS.length) * 100}%` }}
        />
      </div>

      <p className="text-sm font-medium text-ink mb-4">{q.question}</p>

      <div className="space-y-2 mb-4">
        {q.options.map((opt, i) => {
          let cls = 'w-full text-left px-4 py-2.5 rounded border text-sm transition-colors '
          if (!answered) {
            cls += 'border-border bg-paper hover:border-terracotta hover:text-terracotta'
          } else if (i === q.correctIndex) {
            cls += 'border-green-400 bg-green-50 text-green-800 dark:border-green-600 dark:bg-green-900/30 dark:text-green-300 font-medium'
          } else if (i === selected) {
            cls += 'border-red-400 bg-red-50 text-red-800 dark:border-red-600 dark:bg-red-900/30 dark:text-red-300'
          } else {
            cls += 'border-border bg-paper text-muted'
          }
          return (
            <button key={i} onClick={() => handleAnswer(i)} disabled={answered} className={cls}>
              {opt}
            </button>
          )
        })}
      </div>

      {answered && (
        <button
          onClick={handleNext}
          disabled={saving}
          className="w-full bg-terracotta text-white py-2 rounded text-sm font-medium hover:bg-terracotta-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving...' : idx + 1 >= PLACEMENT_QUESTIONS.length ? 'See Results' : 'Next'}
        </button>
      )}
    </div>
  )
}
