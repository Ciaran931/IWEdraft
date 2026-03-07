import { createClient } from '@/lib/supabase/server'
import GrammarReviewSession from '@/components/grammar/GrammarReviewSession'
import Link from 'next/link'
import type { ReviewItem } from '@/components/grammar/GrammarReviewSession'

export default async function GrammarReviewPage() {
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return null

  // Fetch due grammar SRS cards
  const { data: dueCards } = await supabase
    .from('srs_cards')
    .select('*')
    .eq('user_id', authUser.id)
    .eq('card_type', 'grammar')
    .lte('due_date', new Date().toISOString())
    .order('due_date')

  if (!dueCards || dueCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
        <p className="font-serif text-xl mb-2">All caught up!</p>
        <p className="text-muted mb-6">No grammar lessons due right now. Come back later!</p>
        <Link
          href="/grammar"
          className="bg-terracotta text-white px-4 py-2 rounded text-sm font-medium hover:bg-terracotta-light transition-colors"
        >
          Back to Grammar
        </Link>
      </div>
    )
  }

  // Fetch lessons and questions for due cards
  const lessonIds = Array.from(new Set(dueCards.map(c => c.content_id)))

  const [{ data: lessons }, { data: questions }] = await Promise.all([
    supabase.from('grammar_lessons').select('*').in('id', lessonIds),
    supabase.from('grammar_questions').select('*').in('lesson_id', lessonIds),
  ])

  const lessonMap = new Map(lessons?.map(l => [l.id, l]) ?? [])
  const questionMap = new Map<string, typeof questions>()
  questions?.forEach(q => {
    const arr = questionMap.get(q.lesson_id) ?? []
    arr.push(q)
    questionMap.set(q.lesson_id, arr)
  })

  // Build review items, filtering out lessons with no questions
  const items: ReviewItem[] = []
  for (const card of dueCards) {
    const lesson = lessonMap.get(card.content_id)
    const qs = questionMap.get(card.content_id)
    if (lesson && qs && qs.length > 0) {
      items.push({ card, lesson, questions: qs })
    }
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-6 text-center">
        <p className="font-serif text-xl mb-2">All caught up!</p>
        <p className="text-muted mb-6">No grammar lessons due right now. Come back later!</p>
        <Link
          href="/grammar"
          className="bg-terracotta text-white px-4 py-2 rounded text-sm font-medium hover:bg-terracotta-light transition-colors"
        >
          Back to Grammar
        </Link>
      </div>
    )
  }

  return <GrammarReviewSession items={items} userId={authUser.id} />
}
