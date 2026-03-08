'use client'

import { useState } from 'react'
import type { SrsCard } from '@/lib/types'

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-srs-new text-white',
  learning: 'bg-srs-learning text-white',
  review: 'bg-srs-review text-white',
  mature: 'bg-srs-mature text-white',
}

type SortKey = 'date' | 'status' | 'alpha' | 'due'

const STATUS_ORDER: Record<string, number> = { new: 0, learning: 1, review: 2, mature: 3 }

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

function isDue(dateStr: string) {
  return new Date(dateStr) <= new Date()
}

export default function WordListClient({ cards }: { cards: SrsCard[] }) {
  const [sortBy, setSortBy] = useState<SortKey>('date')

  const sorted = [...cards].sort((a, b) => {
    switch (sortBy) {
      case 'alpha':
        return (a.vocab_words?.word ?? '').localeCompare(b.vocab_words?.word ?? '')
      case 'status':
        return (STATUS_ORDER[a.status] ?? 0) - (STATUS_ORDER[b.status] ?? 0)
      case 'due':
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
      case 'date':
      default:
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
  })

  if (cards.length === 0) {
    return (
      <div className="text-center text-muted py-12">
        <p>No words in this deck yet.</p>
        <p className="text-sm mt-1">Words you save while reading will appear here.</p>
      </div>
    )
  }

  return (
    <div>
      {/* Sort controls */}
      <div className="flex items-center gap-2 mb-4 text-sm">
        <span className="text-muted">Sort by:</span>
        {([
          ['date', 'Date added'],
          ['alpha', 'A–Z'],
          ['status', 'Status'],
          ['due', 'Due date'],
        ] as [SortKey, string][]).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSortBy(key)}
            className={`px-2.5 py-1 rounded border text-xs transition-colors ${
              sortBy === key
                ? 'border-terracotta bg-terracotta/5 text-terracotta font-medium'
                : 'border-border text-muted hover:border-terracotta/40'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Word list */}
      <div className="border border-border rounded-lg overflow-hidden divide-y divide-border">
        {sorted.map(card => {
          const word = card.vocab_words
          if (!word) return null
          const due = isDue(card.due_date)

          return (
            <div
              key={card.id}
              className="bg-white px-4 py-3 flex items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-ink">{word.word}</span>
                  <span className="text-xs text-muted italic">{word.pos}</span>
                </div>
                <p className="text-sm text-muted truncate mt-0.5">
                  {word.translations && typeof word.translations === 'object'
                    ? Object.values(word.translations)[0]?.word ?? word.en_definition
                    : word.en_definition}
                </p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
                    STATUS_COLOR[card.status] ?? 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {card.status}
                </span>
                <span className={`text-xs ${due ? 'text-srs-learning font-medium' : 'text-muted'}`}>
                  {due ? 'Due now' : formatDate(card.due_date)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
