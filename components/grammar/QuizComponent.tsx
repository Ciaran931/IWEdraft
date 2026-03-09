'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { applySrs } from '@/lib/srs'
import type { GrammarQuestion, Rating } from '@/lib/types'

interface QuizState {
  questionIdx: number
  selectedIdx: number | null
  answered: boolean
  score: number
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function QuizComponent({
  questions,
  userId,
  lessonId,
  onFinish,
}: {
  questions: GrammarQuestion[]
  userId: string | null
  lessonId: string
  onFinish?: (score: number, total: number) => void
}) {
  const supabase = createClient()
  // Shuffle questions once on mount so users learn the grammar, not the order
  const [shuffled] = useState(() => shuffle(questions))
  const [state, setState] = useState<QuizState>({
    questionIdx: 0,
    selectedIdx: null,
    answered: false,
    score: 0,
  })
  const [finished, setFinished] = useState(false)
  const [saving, setSaving] = useState(false)

  const question = shuffled[state.questionIdx]

  async function handleAnswer(idx: number) {
    if (state.answered) return
    const correct = idx === question.correct_index
    setState(s => ({
      ...s,
      selectedIdx: idx,
      answered: true,
      score: correct ? s.score + 1 : s.score,
    }))
  }

  async function handleNext() {
    if (state.questionIdx + 1 >= shuffled.length) {
      // Quiz done — save grammar cards to SRS if logged in
      if (userId) {
        setSaving(true)
        await saveGrammarProgress()
        setSaving(false)
      }
      setFinished(true)
    } else {
      setState(s => ({
        ...s,
        questionIdx: s.questionIdx + 1,
        selectedIdx: null,
        answered: false,
      }))
    }
  }

  async function saveGrammarProgress() {
    const ratio = state.score / shuffled.length
    let rating: Rating
    if (ratio <= 0.25) rating = 0
    else if (ratio <= 0.5) rating = 1
    else if (ratio <= 0.75) rating = 2
    else rating = 3

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
      if (!newDeck) return
      deckId = newDeck.id
    }

    // Check if an SRS card for this lesson already exists
    const { data: existing } = await supabase
      .from('srs_cards')
      .select('*')
      .eq('user_id', userId)
      .eq('content_id', lessonId)
      .eq('card_type', 'grammar')
      .maybeSingle()

    if (existing) {
      const update = applySrs(existing, rating)
      await supabase.from('srs_cards').update(update).eq('id', existing.id)
    } else {
      const update = applySrs(
        { ease_factor: 2.5, interval: 1, repetitions: 0 } as any,
        rating,
      )
      await supabase.from('srs_cards').insert({
        user_id: userId,
        card_type: 'grammar',
        content_id: lessonId,
        deck_id: deckId,
        ...update,
      })
    }
  }

  if (finished) {
    return (
      <div className="bg-sidebar border border-border rounded-xl p-6 text-center">
        <p className="font-serif text-xl mb-2">
          {state.score} / {shuffled.length}
        </p>
        {onFinish ? (
          <>
            <p className="text-muted text-sm mb-4">
              {state.score === shuffled.length
                ? 'Perfect!'
                : 'Good effort!'
              }
            </p>
            <button
              onClick={() => onFinish(state.score, shuffled.length)}
              className="bg-terracotta text-white px-4 py-2 rounded text-sm font-medium hover:bg-terracotta-light transition-colors"
            >
              Next Lesson →
            </button>
          </>
        ) : userId ? (
          <>
            <p className="text-muted text-sm mb-4">
              {state.score === shuffled.length
                ? 'Perfect! Your progress has been saved.'
                : 'Good effort! Your progress has been saved.'}
            </p>
            <a href="/grammar" className="text-terracotta text-sm hover:underline">
              Back to Grammar →
            </a>
          </>
        ) : (
          <>
            <p className="text-muted text-sm mb-4">
              Sign in to save your progress and review these cards later.
            </p>
            <a href="/login" className="inline-block bg-terracotta text-white px-4 py-2 rounded text-sm font-medium hover:bg-terracotta-light transition-colors">
              Sign in to save progress
            </a>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="bg-sidebar border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-serif text-base">Quiz</h3>
        <span className="text-xs text-muted">
          {state.questionIdx + 1} / {shuffled.length}
        </span>
      </div>

      <p className="text-sm font-medium text-ink mb-4">{question.question}</p>

      <div className="space-y-2 mb-4">
        {question.options.map((option, idx) => {
          let cls = 'w-full text-left px-4 py-2.5 rounded border text-sm transition-colors '
          if (!state.answered) {
            cls += 'border-border bg-surface hover:border-terracotta hover:text-terracotta'
          } else if (idx === question.correct_index) {
            cls += 'border-green-400 bg-green-50 text-green-800 dark:border-green-600 dark:bg-green-900/30 dark:text-green-300 font-medium'
          } else if (idx === state.selectedIdx) {
            cls += 'border-red-400 bg-red-50 text-red-800 dark:border-red-600 dark:bg-red-900/30 dark:text-red-300'
          } else {
            cls += 'border-border bg-surface text-muted'
          }

          return (
            <button
              key={idx}
              onClick={() => handleAnswer(idx)}
              disabled={state.answered}
              className={cls}
            >
              {option}
            </button>
          )
        })}
      </div>

      {state.answered && (
        <div className="mb-4">
          <div className="bg-surface border border-border rounded px-4 py-3 text-sm text-muted">
            {question.explanation}
          </div>
        </div>
      )}

      {state.answered && (
        <button
          onClick={handleNext}
          disabled={saving}
          className="w-full bg-terracotta text-white py-2 rounded text-sm font-medium hover:bg-terracotta-light transition-colors disabled:opacity-50"
        >
          {saving ? 'Saving…' : state.questionIdx + 1 >= shuffled.length ? 'Finish' : 'Next →'}
        </button>
      )}
    </div>
  )
}
