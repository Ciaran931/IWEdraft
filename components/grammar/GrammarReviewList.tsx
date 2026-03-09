'use client'

import { useState } from 'react'
import Link from 'next/link'

interface GrammarReviewItem {
  lessonId: string
  title: string
  level: string
  status: string
  lastReviewedAt: string | null
  dueDate: string
}

const LEVEL_COLORS: Record<string, string> = {
  A1: 'text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-900/30 dark:border-green-700',
  A2: 'text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-900/30 dark:border-green-700',
  B1: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700',
  B2: 'text-blue-700 bg-blue-50 border-blue-200 dark:text-blue-300 dark:bg-blue-900/30 dark:border-blue-700',
  C1: 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-900/30 dark:border-purple-700',
  C2: 'text-purple-700 bg-purple-50 border-purple-200 dark:text-purple-300 dark:bg-purple-900/30 dark:border-purple-700',
}

const STATUS_LABEL: Record<string, string> = {
  new: 'New',
  learning: 'Learning',
  review: 'Review',
  mature: 'Mature',
}

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-srs-new',
  learning: 'bg-srs-learning',
  review: 'bg-srs-review',
  mature: 'bg-srs-mature',
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

function isDueNow(dateStr: string) {
  return new Date(dateStr) <= new Date()
}

const VISIBLE_COUNT = 3

export default function GrammarReviewList({ items }: { items: GrammarReviewItem[] }) {
  const [expanded, setExpanded] = useState(false)

  if (items.length === 0) return null

  const dueNowCount = items.filter(i => isDueNow(i.dueDate)).length
  const visible = expanded ? items : items.slice(0, VISIBLE_COUNT)
  const hasMore = items.length > VISIBLE_COUNT

  return (
    <div className="bg-surface border border-border rounded-lg p-4 mb-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-serif text-lg">My Reviews</h2>
        {dueNowCount > 0 && (
          <Link
            href="/grammar/review"
            className="bg-terracotta text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-terracotta-light transition-colors"
          >
            Start review ({dueNowCount})
          </Link>
        )}
      </div>

      <div className="divide-y divide-border">
        {visible.map(item => {
          const due = isDueNow(item.dueDate)

          return (
            <div
              key={item.lessonId}
              className={`flex items-center gap-3 py-2.5 ${due ? 'bg-terracotta/[0.03]' : ''}`}
            >
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_COLOR[item.status] ?? 'bg-gray-300'}`}
              />

              <Link
                href={`/grammar/${item.lessonId}`}
                className="flex-1 min-w-0 text-sm text-ink hover:text-terracotta transition-colors truncate"
              >
                {item.title}
              </Link>

              <span
                className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${
                  LEVEL_COLORS[item.level] ?? 'bg-gray-50 text-gray-700 border-gray-200'
                }`}
              >
                {item.level}
              </span>

              <span className="text-xs text-muted flex-shrink-0 w-16 text-right">
                {STATUS_LABEL[item.status] ?? item.status}
              </span>

              <span
                className={`text-xs flex-shrink-0 w-20 text-right ${
                  due ? 'text-terracotta font-semibold' : 'text-muted'
                }`}
              >
                {due ? 'Due now' : formatDate(item.dueDate)}
              </span>
            </div>
          )
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-3 text-sm text-terracotta hover:underline transition-colors"
        >
          {expanded ? 'Show less' : `Show all (${items.length})`}
        </button>
      )}
    </div>
  )
}
