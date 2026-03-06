'use client'

import { useState } from 'react'
import type { TextQuestion } from '@/lib/types'

interface Props {
  questions: TextQuestion[]
}

export default function ComprehensionQuiz({ questions }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({})

  function handleSelect(questionId: string, optionIndex: number) {
    if (answers[questionId] !== undefined) return // already answered
    setAnswers(prev => ({ ...prev, [questionId]: optionIndex }))
  }

  return (
    <div className="space-y-8">
      {questions.map((q, qIdx) => {
        const selected = answers[q.id]
        const answered = selected !== undefined
        const isCorrect = selected === q.correct_index

        return (
          <div key={q.id} className="border border-border rounded-lg p-5 bg-paper">
            <p className="font-medium text-ink mb-4">
              {qIdx + 1}. {q.question}
            </p>

            <div className="space-y-2">
              {q.options?.map((option, oIdx) => {
                let optionClass = 'border-border text-ink hover:border-terracotta cursor-pointer'

                if (answered) {
                  if (oIdx === q.correct_index) {
                    optionClass = 'border-green-500 bg-green-50 text-green-800'
                  } else if (oIdx === selected && !isCorrect) {
                    optionClass = 'border-red-400 bg-red-50 text-red-700'
                  } else {
                    optionClass = 'border-border text-muted opacity-60'
                  }
                }

                return (
                  <button
                    key={oIdx}
                    onClick={() => handleSelect(q.id, oIdx)}
                    disabled={answered}
                    className={`w-full text-left px-4 py-2.5 rounded border text-sm transition-colors ${optionClass}`}
                  >
                    {option}
                  </button>
                )
              })}
            </div>

            {answered && q.explanation && (
              <p className="mt-3 text-sm text-muted italic">
                {q.explanation}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}
