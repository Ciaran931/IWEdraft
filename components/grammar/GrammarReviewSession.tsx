'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { applySrs } from '@/lib/srs'
import type { SrsCard, Rating } from '@/lib/types'

const RATING_BUTTONS: { rating: Rating; label: string; color: string }[] = [
  { rating: 0, label: 'Again', color: 'bg-red-100 text-red-700 hover:bg-red-200 border-red-200' },
  { rating: 1, label: 'Hard', color: 'bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200' },
  { rating: 2, label: 'Good', color: 'bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200' },
  { rating: 3, label: 'Easy', color: 'bg-green-100 text-green-700 hover:bg-green-200 border-green-200' },
]

export default function GrammarReviewSession({
  cards,
  userId,
}: {
  cards: SrsCard[]
  userId: string
}) {
  const router = useRouter()
  const supabase = createClient()

  const [queue] = useState<SrsCard[]>(cards)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [answered, setAnswered] = useState(false)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const current = queue[currentIdx]
  const question = current?.grammar_questions
  const progress = Math.round((currentIdx / queue.length) * 100)

  async function handleAnswer(idx: number) {
    if (answered) return
    setSelectedIdx(idx)
    setAnswered(true)
  }

  async function handleRate(rating: Rating) {
    if (!current || submitting) return
    setSubmitting(true)

    const update = applySrs(current, rating)
    await supabase.from('srs_cards').update(update).eq('id', current.id)

    if (currentIdx + 1 >= queue.length) {
      setDone(true)
    } else {
      setCurrentIdx(i => i + 1)
      setSelectedIdx(null)
      setAnswered(false)
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
        <div className="text-4xl mb-4">✅</div>
        <h2 className="font-serif text-2xl mb-2">Grammar review done!</h2>
        <p className="text-muted mb-6">You reviewed {queue.length} cards.</p>
        <button
          onClick={() => router.push('/grammar')}
          className="bg-terracotta text-white px-5 py-2 rounded text-sm font-medium hover:bg-terracotta-light transition-colors"
        >
          Back to Grammar
        </button>
      </div>
    )
  }

  if (!question) {
    return (
      <div className="p-6 text-center text-muted">
        Question data unavailable for this card.
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 p-6 max-w-xl mx-auto w-full">
      {/* Progress */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-1.5 bg-border rounded overflow-hidden">
          <div
            className="h-full bg-terracotta transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-xs text-muted flex-shrink-0">
          {currentIdx + 1} / {queue.length}
        </span>
      </div>

      {/* Question */}
      <div className="bg-white border border-border rounded-xl p-6 flex-1 flex flex-col">
        <p className="font-medium text-ink mb-5">{question.question}</p>

        <div className="space-y-2 mb-5">
          {question.options.map((option, idx) => {
            let cls = 'w-full text-left px-4 py-2.5 rounded border text-sm transition-colors '
            if (!answered) {
              cls += 'border-border bg-paper hover:border-terracotta hover:text-terracotta'
            } else if (idx === question.correct_index) {
              cls += 'border-green-400 bg-green-50 text-green-800 font-medium'
            } else if (idx === selectedIdx) {
              cls += 'border-red-400 bg-red-50 text-red-800'
            } else {
              cls += 'border-border bg-paper text-muted'
            }

            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                disabled={answered}
                className={cls}
              >
                {option}
              </button>
            )
          })}
        </div>

        {answered && (
          <div className="bg-sidebar border border-border rounded px-4 py-3 text-sm text-muted mb-4">
            {question.explanation}
          </div>
        )}

        <div className="mt-auto">
          {answered && (
            <div className="grid grid-cols-4 gap-2">
              {RATING_BUTTONS.map(({ rating, label, color }) => (
                <button
                  key={rating}
                  onClick={() => handleRate(rating)}
                  disabled={submitting}
                  className={`py-2 rounded border text-xs font-medium transition-colors disabled:opacity-50 ${color}`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
