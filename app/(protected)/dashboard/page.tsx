import { createClient } from '@/lib/supabase/server'
import StreakCounter from '@/components/dashboard/StreakCounter'
import ProgressDonut from '@/components/dashboard/ProgressDonut'
import SrsForecast from '@/components/dashboard/SrsForecast'
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
            className="inline-block border border-border px-5 py-2 rounded text-ink hover:bg-sidebar"
          >
            Sign in
          </Link>
        </div>
      </div>
    )
  }

  const thirtyDaysFromNow = new Date()
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30)

  const [{ data: profile }, { data: dueCards }, { data: vocabStatus }, { data: grammarCards }, { data: forecastCards }] =
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
      supabase
        .from('srs_cards')
        .select('due_date')
        .eq('user_id', authUser.id)
        .eq('card_type', 'vocab')
        .lte('due_date', thirtyDaysFromNow.toISOString()),
    ])

  const streakDays = profile?.streak_days ?? 0
  const dueVocabCount = dueCards?.filter(c => c.card_type === 'vocab').length ?? 0
  const dueGrammarCount = dueCards?.filter(c => c.card_type === 'grammar').length ?? 0
  // Build vocab status counts
  const statusCounts = { new: 0, learning: 0, review: 0, mature: 0 }
  vocabStatus?.forEach(card => {
    const s = card.status as keyof typeof statusCounts
    if (s in statusCounts) statusCounts[s]++
  })

  // Build grammar status counts
  const grammarStatusCounts = { new: 0, learning: 0, review: 0, mature: 0 }
  grammarCards?.forEach(card => {
    const s = card.status as keyof typeof grammarStatusCounts
    if (s in grammarStatusCounts) grammarStatusCounts[s]++
  })

  // Build lessonId → status map for grammar grid
  const grammarStatusMap: Record<string, string> = {}
  grammarCards?.forEach(card => {
    grammarStatusMap[card.content_id] = card.status
  })

  // Build 30-day forecast buckets
  const forecastBuckets: { date: string; count: number }[] = []
  const bucketMap = new Map<string, number>()
  const todayKey = new Date().toISOString().slice(0, 10)

  forecastCards?.forEach(card => {
    const day = card.due_date.slice(0, 10)
    // Overdue cards (before today) count as today
    const key = day < todayKey ? todayKey : day
    bucketMap.set(key, (bucketMap.get(key) ?? 0) + 1)
  })

  for (let i = 0; i < 30; i++) {
    const d = new Date()
    d.setDate(d.getDate() + i)
    const key = d.toISOString().slice(0, 10)
    forecastBuckets.push({ date: key, count: bucketMap.get(key) ?? 0 })
  }

  return (
    <div className="p-6 max-w-6xl mx-auto w-full">
      <h1 className="font-serif text-2xl mb-6">Dashboard</h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <StreakCounter days={streakDays} />

        <div className="bg-surface border border-border rounded-lg p-4">
          <p className="text-xs text-muted uppercase tracking-wide mb-3">Vocab Progress</p>
          {Object.values(statusCounts).every(v => v === 0) ? (
            <p className="text-sm text-muted">
              <Link href="/input" className="text-terracotta hover:underline">
                Start reading
              </Link>{' '}
              to build your vocabulary.
            </p>
          ) : (
            <>
              <ProgressDonut counts={statusCounts} />
              <p className="text-xs text-muted mt-3">{dueVocabCount} due today</p>
              {dueVocabCount > 0 && (
                <Link
                  href="/vocab/review"
                  className="mt-1 inline-block text-xs text-terracotta hover:underline"
                >
                  Review vocab →
                </Link>
              )}
            </>
          )}
        </div>

        <div className="col-span-2 md:col-span-1 bg-surface border border-border rounded-lg p-4">
          <p className="text-xs text-muted uppercase tracking-wide mb-3">Grammar Progress</p>
          {Object.values(grammarStatusCounts).every(v => v === 0) ? (
            <p className="text-sm text-muted">
              Start{' '}
              <Link href="/grammar" className="text-terracotta hover:underline">
                grammar lessons
              </Link>{' '}
              to track progress.
            </p>
          ) : (
            <>
              <ProgressDonut counts={grammarStatusCounts} />
              <p className="text-xs text-muted mt-3">{dueGrammarCount} due today</p>
              {dueGrammarCount > 0 && (
                <Link
                  href="/grammar/review"
                  className="mt-1 inline-block text-xs text-terracotta hover:underline"
                >
                  Review grammar →
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      {/* SRS status guide */}
      <details className="mb-8 text-sm">
        <summary className="text-muted cursor-pointer hover:text-ink transition-colors">
          What do the statuses mean?
        </summary>
        <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-surface border border-border rounded p-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-srs-new mr-1.5 align-middle" />
            <span className="font-medium text-ink">New</span>
            <p className="text-xs text-muted mt-1">Not yet studied. Waiting for your first review.</p>
          </div>
          <div className="bg-surface border border-border rounded p-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-srs-learning mr-1.5 align-middle" />
            <span className="font-medium text-ink">Learning</span>
            <p className="text-xs text-muted mt-1">Recently started. Short review intervals while it sticks.</p>
          </div>
          <div className="bg-surface border border-border rounded p-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-srs-review mr-1.5 align-middle" />
            <span className="font-medium text-ink">Review</span>
            <p className="text-xs text-muted mt-1">Graduated from learning. Reviewed on a growing schedule.</p>
          </div>
          <div className="bg-surface border border-border rounded p-3">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-srs-mature mr-1.5 align-middle" />
            <span className="font-medium text-ink">Mature</span>
            <p className="text-xs text-muted mt-1">Well known. Long intervals — you&apos;ve got this one down.</p>
          </div>
        </div>
      </details>

      {/* SRS Forecast */}
      {(forecastCards?.length ?? 0) > 0 && (
        <div className="bg-surface border border-border rounded-lg p-6 mb-8">
          <h2 className="font-serif text-lg mb-4">Upcoming Reviews</h2>
          <SrsForecast buckets={forecastBuckets} />
        </div>
      )}

      {/* Grammar Grid */}
      <div className="bg-surface border border-border rounded-lg p-6">
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
