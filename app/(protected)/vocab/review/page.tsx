import { createClient } from '@/lib/supabase/server'
import VocabReviewSession from '@/components/vocab/VocabReviewSession'
import Link from 'next/link'

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

  let query = supabase
    .from('srs_cards')
    .select('*, vocab_words(*)')
    .eq('user_id', authUser.id)
    .eq('card_type', 'vocab')
    .lte('due_date', new Date().toISOString())
    .order('due_date')

  if (searchParams.deck) {
    query = query.eq('deck_id', searchParams.deck)
  }

  const { data: cards, error } = await query

  if (error) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-600">Something went wrong. Please try again.</p>
      </div>
    )
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

  return <VocabReviewSession cards={cards} userId={authUser.id} />
}
