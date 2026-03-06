'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { GrammarQuestion } from '@/lib/types'

interface QuizState {
  questionIdx: number
  selectedIdx: number | null
  answered: boolean
  score: number
}

export default function QuizComponent({
  questions,
  userId,
  lessonId,
}: {
  questions: GrammarQuestion[]
  userId: string | null
  lessonId: string
}) {
  const supabase = createClient()
  const [state, setState] = useState<QuizState>({
    questionIdx: 0,
    selectedIdx: null,
    answered: false,
    score: 0,
  })
  const [finished, setFinished] = useState(false)
  const [saving, setSaving] = useState(false)

  const question = questions[state.questionIdx]

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
    if (state.questionIdx + 1 >= questions.length) {
      // Quiz done — save grammar cards to SRS if logged in
      if (userId) {
        setSaving(true)
        await saveGrammarCards()
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

  async function saveGrammarCards() {
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

    // For each question, insert if not already present
    for (const q of questions) {
      const { data: existing } = await supabase
        .from('srs_cards')
        .select('id')
        .eq('user_id', userId)
        .eq('content_id', q.id)
        .maybeSingle()

      if (!existing) {
        await supabase.from('srs_cards').insert({
          user_id: userId,
          card_type: 'grammar',
          content_id: q.id,
          deck_id: deckId,
          status: 'learning',
          due_date: new Date().toISOString(),
          ease_factor: 2.5,
          interval: 1,
          repetitions: 0,
        })
      }
    }
  }

  if (finished) {
    return (
      <div className="bg-sidebar border border-border rounded-xl p-6 text-center">
        <p className="font-serif text-xl mb-2">
          {state.score} / {questions.length}
        </p>
        {userId ? (
          <>
            <p className="text-muted text-sm mb-4">
              {state.score === questions.length
                ? 'Perfect! These questions have been added to your grammar reviews.'
                : 'Good effort! Review cards have been added to your SRS queue.'}
            </p>
            <a href="/grammar/review" className="text-terracotta text-sm hover:underline">
              Review grammar cards →
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
          {state.questionIdx + 1} / {questions.length}
        </span>
      </div>

      <p className="text-sm font-medium text-ink mb-4">{question.question}</p>

      <div className="space-y-2 mb-4">
        {question.options.map((option, idx) => {
          let cls = 'w-full text-left px-4 py-2.5 rounded border text-sm transition-colors '
          if (!state.answered) {
            cls += 'border-border bg-white hover:border-terracotta hover:text-terracotta'
          } else if (idx === question.correct_index) {
            cls += 'border-green-400 bg-green-50 text-green-800 font-medium'
          } else if (idx === state.selectedIdx) {
            cls += 'border-red-400 bg-red-50 text-red-800'
          } else {
            cls += 'border-border bg-white text-muted'
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
          <div className="bg-white border border-border rounded px-4 py-3 text-sm text-muted">
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
          {saving ? 'Saving…' : state.questionIdx + 1 >= questions.length ? 'Finish' : 'Next →'}
        </button>
      )}
    </div>
  )
}
