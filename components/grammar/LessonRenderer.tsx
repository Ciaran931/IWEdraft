'use client'

import { useState } from 'react'
import QuizComponent from './QuizComponent'
import type { GrammarLesson, GrammarQuestion } from '@/lib/types'

export default function LessonRenderer({
  lesson,
  questions,
  userId,
}: {
  lesson: GrammarLesson
  questions: GrammarQuestion[]
  userId: string | null
}) {
  const [showQuiz, setShowQuiz] = useState(false)

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-xs text-muted uppercase tracking-wide">{lesson.level}</span>
          <span className="text-border">·</span>
          <span className="text-xs text-muted">{lesson.category}</span>
        </div>
        <h1 className="font-serif text-2xl mb-8">{lesson.title}</h1>

        {/* Explanation blocks */}
        <div className="space-y-4 mb-10">
          {lesson.explanation.map((block, i) => {
            if (block.type === 'text') {
              return (
                <p key={i} className="text-sm leading-relaxed text-ink">
                  {block.content}
                </p>
              )
            }
            if (block.type === 'example') {
              return (
                <div
                  key={i}
                  className="bg-sidebar border-l-4 border-terracotta-muted rounded-r px-4 py-3"
                >
                  <p className="text-sm font-medium text-ink">{block.english}</p>
                  <p className="text-sm text-muted mt-0.5">{block.translation}</p>
                </div>
              )
            }
            if (block.type === 'rule') {
              return (
                <div
                  key={i}
                  className="bg-amber-50 border border-amber-200 rounded px-4 py-3 text-sm text-amber-900"
                >
                  📌 {block.content}
                </div>
              )
            }
            return null
          })}
        </div>

        {/* Quiz */}
        {questions.length > 0 && (
          <div>
            {!showQuiz ? (
              <button
                onClick={() => setShowQuiz(true)}
                className="bg-terracotta text-white px-6 py-2.5 rounded text-sm font-medium hover:bg-terracotta-light transition-colors"
              >
                Take the quiz
              </button>
            ) : (
              <QuizComponent questions={questions} userId={userId} lessonId={lesson.id} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
