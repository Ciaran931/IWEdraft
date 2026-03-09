import { createClient } from '@/lib/supabase/server'
import { GRAMMAR_TREE } from '@/lib/grammar-tree'
import GrammarReviewList from '@/components/grammar/GrammarReviewList'
import GrammarLevelList from '@/components/grammar/GrammarLevelList'
import Link from 'next/link'

const LEVEL_COLORS: Record<string, string> = {
  A1: 'text-green-700 border-green-200 bg-green-50 dark:text-green-300 dark:border-green-700 dark:bg-green-900/30',
  A2: 'text-green-700 border-green-200 bg-green-50 dark:text-green-300 dark:border-green-700 dark:bg-green-900/30',
  B1: 'text-blue-700 border-blue-200 bg-blue-50 dark:text-blue-300 dark:border-blue-700 dark:bg-blue-900/30',
  B2: 'text-blue-700 border-blue-200 bg-blue-50 dark:text-blue-300 dark:border-blue-700 dark:bg-blue-900/30',
  C1: 'text-purple-700 border-purple-200 bg-purple-50 dark:text-purple-300 dark:border-purple-700 dark:bg-purple-900/30',
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

      {/* Lesson list grouped by level */}
      <GrammarLevelList
        statusMap={statusMap}
        dueSet={Array.from(dueSet)}
        lessonSet={Array.from(lessonSet)}
        levelColors={LEVEL_COLORS}
      />
    </div>
  )
}
