import { createClient } from '@/lib/supabase/server'
import StreakCounter from '@/components/dashboard/StreakCounter'
import VocabDonut from '@/components/dashboard/VocabDonut'
import GrammarGrid from '@/components/grammar/GrammarGrid'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return (
      <div className="p-6 max-w-6xl mx-auto w-full">
        <h1 className="font-serif text-2xl mb-2">Welcome to Input With Ease</h1>
        <p className="text-muted mb-6">
          Build your English through comprehensible input. Read texts at your level, discover new
          vocabulary in context, and track your progress with spaced repetition.
        </p>
        <div className="flex gap-4">
          <Link
            href="/input"
            className="inline-block bg-terracotta text-white px-5 py-2 rounded hover:opacity-90"
          >
            Start Reading
          </Link>
          <Link
            href="/login"
            className="inline-block border border-border px-5 py-2 rounded text-ink hover:bg-gray-50"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  const [{ data: profile }, { data: dueCards }, { data: vocabStatus }, { data: grammarCards }] =
    await Promise.all([
      supabase.from('users').select('streak_days').eq('id', authUser.id).single(),
      supabase
        .from('srs_cards')
        .select('id, card_type')
        .eq('user_id', authUser.id)
        .lte('due_date', new Date().toISOString()),
      supabase
        .from('srs_cards')
        .select('status')
        .eq('user_id', authUser.id)
        .eq('card_type', 'vocab'),
      supabase
        .from('srs_cards')
        .select('content_id, status')
        .eq('user_id', authUser.id)
        .eq('card_type', 'grammar'),
    ])

  const streakDays = profile?.streak_days ?? 0
  const dueVocabCount = dueCards?.filter(c => c.card_type === 'vocab').length ?? 0
  const dueGrammarCount = dueCards?.filter(c => c.card_type === 'grammar').length ?? 0
  const dueCount = dueVocabCount + dueGrammarCount

  // Build vocab status counts
  const statusCounts = { new: 0, learning: 0, review: 0, mature: 0 }
  vocabStatus?.forEach(card => {
    const s = card.status as keyof typeof statusCounts
    if (s in statusCounts) statusCounts[s]++
  })

  // Build lessonId → status map for grammar grid
  const grammarStatusMap: Record<string, string> = {}
  grammarCards?.forEach(card => {
    grammarStatusMap[card.content_id] = card.status
  })

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <h1 className="font-serif text-2xl mb-6">Dashboard</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StreakCounter days={streakDays} />

        <div className="bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted uppercase tracking-wide mb-1">Due Today</p>
          <p className="font-serif text-3xl text-ink">{dueCount}</p>
          <p className="text-xs text-muted mt-1">cards to review</p>
          {dueVocabCount > 0 && (
            <Link
              href="/vocab/review"
              className="mt-3 inline-block text-xs text-terracotta hover:underline"
            >
              Review vocab ({dueVocabCount}) →
            </Link>
          )}
          {dueGrammarCount > 0 && (
            <Link
              href="/grammar/review"
              className="mt-3 inline-block text-xs text-terracotta hover:underline ml-3"
            >
              Review grammar ({dueGrammarCount}) →
            </Link>
          )}
        </div>

        <div className="col-span-2 md:col-span-1 bg-white border border-border rounded-lg p-4">
          <p className="text-xs text-muted uppercase tracking-wide mb-3">Vocab Progress</p>
          {Object.values(statusCounts).every(v => v === 0) ? (
            <p className="text-sm text-muted">
              <Link href="/input" className="text-terracotta hover:underline">
                Start reading
              </Link>{' '}
              to build your vocabulary.
            </p>
          ) : (
            <VocabDonut counts={statusCounts} />
          )}
        </div>
      </div>

      {/* Grammar Grid */}
      <div className="bg-white border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg">Grammar Progress</h2>
          <Link href="/grammar" className="text-sm text-terracotta hover:underline">
            Open Grammar →
          </Link>
        </div>
        <GrammarGrid statusMap={grammarStatusMap} />
      </div>
    </div>
  )
}
