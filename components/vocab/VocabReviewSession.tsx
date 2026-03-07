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

export default function VocabReviewSession({
  cards,
  userId,
  language,
}: {
  cards: SrsCard[]
  userId: string
  language: string
}) {
  const router = useRouter()
  const supabase = createClient()

  const [queue, setQueue] = useState<SrsCard[]>(cards)
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [done, setDone] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const current = queue[currentIdx]
  const progress = Math.round((currentIdx / queue.length) * 100)

  // Update streak at start (fire and forget)
  useState(() => {
    supabase.rpc('update_streak', { p_user_id: userId })
  })

  async function handleRating(rating: Rating) {
    if (!current || submitting) return
    setSubmitting(true)

    const update = applySrs(current, rating)
    await supabase
      .from('srs_cards')
      .update(update)
      .eq('id', current.id)

    if (currentIdx + 1 >= queue.length) {
      setDone(true)
    } else {
      setCurrentIdx(i => i + 1)
      setFlipped(false)
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
        <div className="text-4xl mb-4">🎉</div>
        <h2 className="font-serif text-2xl mb-2">Session complete!</h2>
        <p className="text-muted mb-6">You reviewed {queue.length} cards.</p>
        <button
          onClick={() => router.push('/vocab')}
          className="bg-terracotta text-white px-5 py-2 rounded text-sm font-medium hover:bg-terracotta-light transition-colors"
        >
          Back to Vocab
        </button>
      </div>
    )
  }

  if (!current) return null

  const word = current.vocab_words

  return (
    <div className="flex flex-col flex-1 p-6 max-w-xl mx-auto w-full">
      {/* Progress bar */}
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

      {/* Card */}
      <div className="flex-1 flex flex-col">
        {/* Front */}
        <div className="bg-white border border-border rounded-xl p-8 mb-4 text-center flex-1 flex flex-col items-center justify-center">
          {word ? (
            <>
              <p className="font-serif text-3xl text-ink mb-1">{word.word}</p>
              <p className="text-sm text-muted italic">{word.pos}</p>
            </>
          ) : (
            <p className="text-muted">Loading…</p>
          )}

          {current.source_sentence && (
            <p className="mt-4 text-sm italic text-muted border-l-2 border-terracotta-muted pl-3 text-left max-w-xs">
              {current.source_sentence}
            </p>
          )}

          {!flipped && (
            <button
              onClick={() => setFlipped(true)}
              className="mt-8 bg-paper border border-border px-6 py-2 rounded text-sm font-medium text-muted hover:border-terracotta hover:text-terracotta transition-colors"
            >
              Show answer
            </button>
          )}
        </div>

        {/* Back (revealed) */}
        {flipped && word && (
          <div className="bg-sidebar border border-border rounded-xl p-6 mb-4 space-y-3">
            <div>
              <p className="text-terracotta font-medium text-lg">
                {word.translations?.[language]?.word ?? word.word}
              </p>
            </div>

            <div className="text-sm space-y-1">
              <p>
                <span className="font-medium">EN: </span>
                <span className="text-muted">
                  {current.context_definition ?? word.en_definition}
                </span>
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Rating buttons */}
      {flipped && (
        <div className="grid grid-cols-4 gap-2">
          {RATING_BUTTONS.map(({ rating, label, color }) => (
            <button
              key={rating}
              onClick={() => handleRating(rating)}
              disabled={submitting}
              className={`py-2.5 rounded border text-sm font-medium transition-colors disabled:opacity-50 ${color}`}
            >
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
