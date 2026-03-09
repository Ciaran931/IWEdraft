'use client'

import Link from 'next/link'
import { GRAMMAR_TREE } from '@/lib/grammar-tree'

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  A2: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  B1: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  B2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  C1: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  C2: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
}

function statusColor(status: string | undefined) {
  if (status === 'mature') return 'bg-mindmap-green border-green-300 dark:border-green-700'
  if (status) return 'bg-mindmap-orange border-orange-300 dark:border-orange-700'
  return 'bg-mindmap-grey border-gray-200 dark:border-gray-600'
}

export default function GrammarGrid({
  statusMap,
}: {
  statusMap: Record<string, string>
}) {
  return (
    <div className="space-y-3">
      {GRAMMAR_TREE.map(level => (
        <div key={level.level}>
          <p className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded mb-1 ${LEVEL_COLORS[level.level] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
            {level.level}
          </p>
          <div className="flex flex-wrap gap-1">
            {level.children.flatMap(cat =>
              cat.children
                .filter(c => c.type === 'leaf')
                .map(leaf => (
                  <Link
                    key={leaf.id}
                    href={`/grammar/${leaf.id}`}
                    title={leaf.label}
                    className={`w-4 h-4 rounded-sm border transition-colors hover:ring-2 hover:ring-terracotta/40 ${statusColor(statusMap[leaf.id])}`}
                  />
                ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
