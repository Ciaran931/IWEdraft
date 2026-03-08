import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import WordListClient from './WordListClient'

export default async function DeckDetailPage({
  params,
}: {
  params: Promise<{ deckId: string }>
}) {
  const { deckId } = await params
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <p className="text-muted">Sign in to view your vocabulary.</p>
        <a href="/login" className="text-terracotta underline text-sm mt-2 inline-block">Sign in</a>
      </div>
    )
  }

  const { data: deck } = await supabase
    .from('srs_decks')
    .select('*')
    .eq('id', deckId)
    .single()

  if (!deck) return notFound()

  // Verify access: user owns the deck or it's a shared (null user_id) deck
  if (deck.user_id && deck.user_id !== authUser.id) return notFound()

  const { data: cards } = await supabase
    .from('srs_cards')
    .select('*, vocab_words(*)')
    .eq('user_id', authUser.id)
    .eq('deck_id', deckId)
    .eq('card_type', 'vocab')
    .order('created_at', { ascending: false })

  const now = new Date().toISOString()
  const dueCount = cards?.filter(c => c.due_date <= now).length ?? 0

  return (
    <div className="p-6 max-w-4xl mx-auto w-full">
      <div className="flex items-center gap-2 mb-1">
        <Link href="/vocab" className="text-muted hover:text-ink transition-colors text-sm">
          ← Vocab
        </Link>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-serif text-2xl">{deck.name}</h1>
          <p className="text-sm text-muted mt-1">
            {cards?.length ?? 0} words
            {dueCount > 0 && (
              <span className="text-srs-learning font-medium ml-2">{dueCount} due</span>
            )}
          </p>
        </div>
        {dueCount > 0 && (
          <Link
            href={`/vocab/review?deck=${deckId}`}
            className="bg-terracotta text-white px-4 py-2 rounded text-sm font-medium hover:bg-terracotta-light transition-colors"
          >
            Review ({dueCount})
          </Link>
        )}
      </div>

      <WordListClient cards={cards ?? []} />
    </div>
  )
}
