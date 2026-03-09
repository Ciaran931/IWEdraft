import Link from 'next/link'
import { GRAMMAR_TREE } from '@/lib/grammar-tree'

interface Props {
  statusMap: Record<string, string>
  dueSet: string[]
  lessonSet: string[]
  levelColors: Record<string, string>
}

export default function GrammarLevelList({ statusMap, dueSet, lessonSet, levelColors }: Props) {
  const dueSetLookup = new Set(dueSet)
  const lessonSetLookup = new Set(lessonSet)

  return (
    <div className="space-y-8">
      {GRAMMAR_TREE.map(levelData => (
        <div key={levelData.level}>
          <h2 className="font-serif text-xl mb-4 flex items-center gap-2">
            <span
              className={`text-sm font-sans font-semibold px-2 py-0.5 rounded border ${
                levelColors[levelData.level] ?? 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
              }`}
            >
              {levelData.level}
            </span>
          </h2>

          {levelData.children.map(cat => (
            <div key={cat.label} className="mb-4">
              <h3 className="text-sm font-medium text-muted uppercase tracking-wide mb-2">
                {cat.label}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {cat.children.map(child => {
                  if (child.type !== 'leaf') return null
                  const hasContent = lessonSetLookup.has(child.id)
                  const status = statusMap[child.id]
                  const isDue = dueSetLookup.has(child.id)
                  const statusDot = status === 'mature'
                    ? 'bg-mindmap-green'
                    : status
                    ? 'bg-mindmap-orange'
                    : 'bg-mindmap-grey'

                  return (
                    <Link
                      key={child.id}
                      href={`/grammar/${child.id}`}
                      className="flex items-center gap-3 bg-surface border border-border rounded px-3 py-2.5 text-sm hover:border-terracotta transition-colors group"
                    >
                      <span
                        className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${statusDot}`}
                      />
                      <span className="truncate text-ink group-hover:text-terracotta transition-colors">
                        {child.label}
                      </span>
                      {isDue && (
                        <span className="ml-auto text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-terracotta/10 text-terracotta flex-shrink-0">
                          Due
                        </span>
                      )}
                      {!hasContent && !isDue && (
                        <span className="ml-auto text-xs text-muted flex-shrink-0">Soon</span>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
