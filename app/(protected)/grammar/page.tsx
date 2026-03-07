import { createClient } from '@/lib/supabase/server'
import { GRAMMAR_TREE } from '@/lib/grammar-tree'
import GrammarGrid from '@/components/grammar/GrammarGrid'
import Link from 'next/link'

const LEVEL_COLORS: Record<string, string> = {
  A1: 'text-green-700 border-green-200 bg-green-50',
  A2: 'text-green-700 border-green-200 bg-green-50',
  B1: 'text-blue-700 border-blue-200 bg-blue-50',
  B2: 'text-blue-700 border-blue-200 bg-blue-50',
  C1: 'text-purple-700 border-purple-200 bg-purple-50',
  C2: 'text-purple-700 border-purple-200 bg-purple-50',
}

export default async function GrammarPage() {
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const grammarCardsResult = authUser
    ? await supabase
        .from('srs_cards')
        .select('content_id, status, due_date')
        .eq('user_id', authUser.id)
        .eq('card_type', 'grammar')
    : { data: null }
  const { data: grammarCards } = grammarCardsResult

  const { data: lessons } = await supabase
    .from('grammar_lessons')
    .select('id, title, level, category')

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

  const lessonSet = new Set(lessons?.map(l => l.id) ?? [])

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <h1 className="font-serif text-2xl mb-6">Grammar</h1>

      {dueSet.size > 0 && (
        <div className="bg-terracotta/5 border border-terracotta/20 rounded-lg px-4 py-3 mb-6 flex items-center justify-between">
          <p className="text-sm text-ink">
            You have <span className="font-semibold">{dueSet.size}</span> grammar lesson{dueSet.size !== 1 ? 's' : ''} due for review
          </p>
          <Link
            href="/grammar/review"
            className="bg-terracotta text-white px-3 py-1.5 rounded text-sm font-medium hover:bg-terracotta-light transition-colors flex-shrink-0"
          >
            Start review →
          </Link>
        </div>
      )}

      {/* Compact grid overview */}
      <div className="bg-white border border-border rounded-lg p-4 mb-8">
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
                  LEVEL_COLORS[levelData.level] ?? 'bg-gray-50 text-gray-700 border-gray-200'
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
                        className="flex items-center gap-3 bg-white border border-border rounded px-3 py-2.5 text-sm hover:border-terracotta transition-colors group"
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
