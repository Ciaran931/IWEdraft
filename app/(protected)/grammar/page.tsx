import { createClient } from '@/lib/supabase/server'
import { GRAMMAR_TREE } from '@/lib/grammar-tree'
import GrammarGrid from '@/components/grammar/GrammarGrid'
import GrammarReviewList from '@/components/grammar/GrammarReviewList'
import Link from 'next/link'

const LEVEL_COLORS: Record<string, string> = {
  A1: 'text-green-700 border-green-200 bg-green-50 dark:text-green-300 dark:border-green-700 dark:bg-green-900/30',
  A2: 'text-green-700 border-green-200 bg-green-50 dark:text-green-300 dark:border-green-700 dark:bg-green-900/30',
  B1: 'text-blue-700 border-blue-200 bg-blue-50 dark:text-blue-300 dark:border-blue-700 dark:bg-blue-900/30',
  B2: 'text-blue-700 border-blue-200 bg-blue-50 dark:text-blue-300 dark:border-blue-700 dark:bg-blue-900/30',
  C1: 'text-purple-700 border-purple-200 bg-purple-50 dark:text-purple-300 dark:border-purple-700 dark:bg-purple-900/30',
  C2: 'text-purple-700 border-purple-200 bg-purple-50 dark:text-purple-300 dark:border-purple-700 dark:bg-purple-900/30',
}

export default async function GrammarPage() {
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  // Parallelize grammar cards + lessons fetch
  const [grammarCardsResult, { data: lessons }] = await Promise.all([
    authUser
      ? supabase
          .from('srs_cards')
          .select('content_id, status, due_date, last_reviewed_at')
          .eq('user_id', authUser.id)
          .eq('card_type', 'grammar')
      : Promise.resolve({ data: null }),
    supabase.from('grammar_lessons').select('id, title, level, category'),
  ])
  const { data: grammarCards } = grammarCardsResult

  // Build lessonId → lesson lookup
  const lessonLookup: Record<string, { title: string; level: string }> = {}
  lessons?.forEach(l => { lessonLookup[l.id] = { title: l.title, level: l.level } })

  // Build lessonId → status map
  const statusMap: Record<string, string> = {}
  const dueSet = new Set<string>()
  const now = new Date().toISOString()
  grammarCards?.forEach(card => {
    statusMap[card.content_id] = card.status
    if (card.due_date && card.due_date <= now) {
      dueSet.add(card.content_id)
    }
  })

  // Build review list items sorted by due date (due now first)
  const reviewItems = (grammarCards ?? [])
    .filter(card => lessonLookup[card.content_id])
    .map(card => ({
      lessonId: card.content_id,
      title: lessonLookup[card.content_id].title,
      level: lessonLookup[card.content_id].level,
      status: card.status,
      lastReviewedAt: card.last_reviewed_at ?? null,
      dueDate: card.due_date,
    }))
    .sort((a, b) => {
      const aDue = new Date(a.dueDate) <= new Date(now)
      const bDue = new Date(b.dueDate) <= new Date(now)
      if (aDue && !bDue) return -1
      if (!aDue && bDue) return 1
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    })

  const lessonSet = new Set(lessons?.map(l => l.id) ?? [])

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <h1 className="font-serif text-2xl mb-6">Grammar</h1>

      {/* My Reviews section */}
      <GrammarReviewList items={reviewItems} />

      {/* Compact grid overview */}
      <div className="bg-surface border border-border rounded-lg p-4 mb-8">
        <h2 className="font-serif text-lg mb-3">Progress</h2>
        <GrammarGrid statusMap={statusMap} />
      </div>

      {/* Lesson list grouped by level */}
      <div className="space-y-8">
        {GRAMMAR_TREE.map(levelData => (
          <div key={levelData.level}>
            <h2 className="font-serif text-xl mb-4 flex items-center gap-2">
              <span
                className={`text-sm font-sans font-semibold px-2 py-0.5 rounded border ${
                  LEVEL_COLORS[levelData.level] ?? 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
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
                    const hasContent = lessonSet.has(child.id)
                    const status = statusMap[child.id]
                    const isDue = dueSet.has(child.id)
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
    </div>
  )
}
