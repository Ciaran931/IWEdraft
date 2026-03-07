import { createClient } from '@/lib/supabase/server'
import VocabReviewSession from '@/components/vocab/VocabReviewSession'
import Link from 'next/link'
import type { SrsCard } from '@/lib/types'

export default async function VocabReviewPage({
  searchParams,
}: {
  searchParams: { deck?: string }
}) {
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return null

  const { data: profile } = await supabase
    .from('users')
    .select('language_code')
    .eq('id', authUser.id)
    .single()
  const language = profile?.language_code ?? 'pl'

  let query = supabase
    .from('srs_cards')
    .select('*')
    .eq('user_id', authUser.id)
    .eq('card_type', 'vocab')
    .lte('due_date', new Date().toISOString())
    .order('due_date')

  if (searchParams.deck) {
    query = query.eq('deck_id', searchParams.deck)
  }

  const { data: rawCards, error } = await query

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Something went wrong. Please try again.</p>
      </div>
    )
  }

  // Two-step: fetch vocab_words separately (content_id has no FK constraint)
  let cards: SrsCard[] = rawCards ?? []
  if (cards.length > 0) {
    const wordIds = Array.from(new Set(cards.map(c => c.content_id)))
    const { data: words } = await supabase
      .from('vocab_words')
      .select('*')
      .in('id', wordIds)
    const wordMap = new Map(words?.map(w => [w.id, w]) ?? [])
    cards = cards.map(card => ({ ...card, vocab_words: wordMap.get(card.content_id) }))
  }

  if (!cards || cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
        <p className="font-serif text-xl mb-2">All caught up!</p>
        <p className="text-muted mb-6">No cards due right now. Come back later!</p>
        <Link
          href="/vocab"
          className="bg-terracotta text-white px-4 py-2 rounded text-sm font-medium hover:bg-terracotta-light transition-colors"
        >
          Back to Vocab
        </Link>
      </div>
    )
  }

  return <VocabReviewSession cards={cards} userId={authUser.id} language={language} />
}
