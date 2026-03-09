import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_COLOR: Record<string, string> = {
  new: 'bg-srs-new',
  learning: 'bg-srs-learning',
  review: 'bg-srs-review',
  mature: 'bg-srs-mature',
}

export default async function VocabPage() {
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) {
    return (
      <div className="p-6 max-w-4xl mx-auto w-full flex flex-col items-center justify-center min-h-64 text-center">
        <h1 className="font-serif text-2xl mb-3">Vocabulary</h1>
        <p className="text-muted mb-6">Sign in to track your flashcards and review progress.</p>
        <a href="/login" className="bg-terracotta text-white px-5 py-2 rounded text-sm font-medium hover:bg-terracotta-light transition-colors">
          Sign in
        </a>
      </div>
    )
  }

  const { data: decks } = await supabase
    .from('srs_decks')
    .select('*')
    .or(`user_id.eq.${authUser.id},user_id.is.null`)
    .order('deck_type')

  const { data: cardCounts } = await supabase
    .from('srs_cards')
    .select('deck_id, status')
    .eq('user_id', authUser.id)
    .eq('card_type', 'vocab')

  // Group counts by deck
  const deckStats: Record<string, Record<string, number>> = {}
  cardCounts?.forEach(card => {
    if (!card.deck_id) return
    if (!deckStats[card.deck_id]) deckStats[card.deck_id] = {}
    const s = card.status as string
    deckStats[card.deck_id][s] = (deckStats[card.deck_id][s] ?? 0) + 1
  })

  const now = new Date().toISOString()
  const { data: dueCards } = await supabase
    .from('srs_cards')
    .select('deck_id', { count: 'exact' })
    .eq('user_id', authUser.id)
    .eq('card_type', 'vocab')
    .lte('due_date', now)

  const dueCounts: Record<string, number> = {}
  dueCards?.forEach(card => {
    if (!card.deck_id) return
    dueCounts[card.deck_id] = (dueCounts[card.deck_id] ?? 0) + 1
  })

  const hasCustomDeck = decks?.some(d => d.deck_type === 'custom')

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl">Vocabulary</h1>
        {Object.values(dueCounts).some(n => n > 0) && (
          <Link
            href="/vocab/review"
            className="bg-terracotta text-white px-4 py-2 rounded text-sm font-medium hover:bg-terracotta-light transition-colors"
          >
            Review due cards
          </Link>
        )}
      </div>

      {!hasCustomDeck && (
        <div className="bg-sidebar border border-border rounded-lg p-4 mb-6 text-sm text-muted">
          Words you save while reading will appear here.
        </div>
      )}

      <div className="space-y-3">
        {decks?.map(deck => {
          const stats = deckStats[deck.id] ?? {}
          const total = Object.values(stats).reduce((s, n) => s + n, 0)
          const due = dueCounts[deck.id] ?? 0

          return (
            <div
              key={deck.id}
              className="bg-surface border border-border rounded-lg p-5 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Link
                    href={`/vocab/${deck.id}`}
                    className="font-medium text-ink truncate hover:text-terracotta transition-colors"
                  >
                    {deck.name}
                  </Link>
                  <span className="text-xs text-muted border border-border rounded px-1.5 py-0.5 capitalize">
                    {deck.deck_type}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted">
                  <span>{total} cards</span>
                  {due > 0 && (
                    <span className="text-srs-learning font-medium">{due} due</span>
                  )}
                </div>
                {/* Status bar */}
                {total > 0 && (
                  <div className="flex h-1.5 rounded overflow-hidden mt-2 gap-px">
                    {(['new', 'learning', 'review', 'mature'] as const).map(s => {
                      const pct = ((stats[s] ?? 0) / total) * 100
                      return pct > 0 ? (
                        <div
                          key={s}
                          className={`${STATUS_COLOR[s]} opacity-80`}
                          style={{ width: `${pct}%` }}
                        />
                      ) : null
                    })}
                  </div>
                )}
              </div>

              {due > 0 ? (
                <Link
                  href={`/vocab/review?deck=${deck.id}`}
                  className="flex-shrink-0 bg-terracotta text-white px-3 py-1.5 rounded text-sm hover:bg-terracotta-light transition-colors"
                >
                  Review ({due})
                </Link>
              ) : (
                <span className="flex-shrink-0 text-xs text-muted">All caught up</span>
              )}
            </div>
          )
        })}

        {(!decks || decks.length === 0) && (
          <p className="text-center text-muted py-12">No decks yet.</p>
        )}
      </div>
    </div>
  )
}
