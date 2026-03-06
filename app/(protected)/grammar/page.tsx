import { createClient } from '@/lib/supabase/server'
import MindmapWrapper from '@/components/grammar/MindmapWrapper'
import { GRAMMAR_TREE } from '@/lib/grammar-tree'
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
        .select('content_id, status')
        .eq('user_id', authUser.id)
        .eq('card_type', 'grammar')
    : { data: null }
  const { data: grammarCards } = grammarCardsResult

  const { data: lessons } = await supabase
    .from('grammar_lessons')
    .select('id, title, level, category')

  // Build lessonId → status map (worst status wins)
  const statusMap: Record<string, string> = {}
  grammarCards?.forEach(card => {
    const rank = { new: 0, learning: 0, review: 1, mature: 2 }
    const existing = statusMap[card.content_id]
    if (!existing || rank[card.status as keyof typeof rank] < rank[existing as keyof typeof rank]) {
      statusMap[card.content_id] = card.status
    }
  })

  const lessonSet = new Set(lessons?.map(l => l.id) ?? [])

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <h1 className="font-serif text-2xl mb-6">Grammar</h1>

      {/* Mindmap */}
      <div className="bg-white border border-border rounded-lg p-6 mb-8">
        <h2 className="font-serif text-lg mb-4">Progress Map</h2>
        <MindmapWrapper statusMap={statusMap} />
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
                        {!hasContent && (
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
