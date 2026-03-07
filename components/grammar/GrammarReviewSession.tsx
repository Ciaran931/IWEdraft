'use client'

import { useState } from 'react'
import QuizComponent from './QuizComponent'
import Link from 'next/link'
import type { SrsCard, GrammarLesson, GrammarQuestion } from '@/lib/types'

export interface ReviewItem {
  card: SrsCard
  lesson: GrammarLesson
  questions: GrammarQuestion[]
}

export default function GrammarReviewSession({
  items,
  userId,
}: {
  items: ReviewItem[]
  userId: string
}) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const [done, setDone] = useState(false)

  if (done || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
        <p className="font-serif text-xl mb-2">Session complete!</p>
        <p className="text-muted mb-6">
          You reviewed {items.length} lesson{items.length !== 1 ? 's' : ''}.
        </p>
        <Link
          href="/grammar"
          className="bg-terracotta text-white px-4 py-2 rounded text-sm font-medium hover:bg-terracotta-light transition-colors"
        >
          Back to Grammar
        </Link>
      </div>
    )
  }

  const item = items[currentIdx]

  function handleFinish() {
    if (currentIdx + 1 >= items.length) {
      setDone(true)
    } else {
      setCurrentIdx(i => i + 1)
    }
  }

  return (
    <div className="p-6 max-w-2xl mx-auto w-full">
      <div className="flex items-center justify-between mb-4">
        <h1 className="font-serif text-xl">Grammar Review</h1>
        <span className="text-sm text-muted">
          Lesson {currentIdx + 1} of {items.length}
        </span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-border rounded-full h-1.5 mb-6">
        <div
          className="bg-terracotta h-1.5 rounded-full transition-all"
          style={{ width: `${((currentIdx) / items.length) * 100}%` }}
        />
      </div>

      <p className="text-sm text-muted mb-4">{item.lesson.title}</p>

      <QuizComponent
        key={item.card.id}
        questions={item.questions}
        userId={userId}
        lessonId={item.lesson.id}
        onFinish={handleFinish}
      />
    </div>
  )
}
