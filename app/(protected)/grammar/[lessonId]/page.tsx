import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import LessonRenderer from '@/components/grammar/LessonRenderer'
import Link from 'next/link'
import type { GrammarLesson, GrammarQuestion } from '@/lib/types'

export default async function LessonPage({ params }: { params: { lessonId: string } }) {
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  const [{ data: lesson }, { data: questions }] = await Promise.all([
    supabase.from('grammar_lessons').select('*').eq('id', params.lessonId).single(),
    supabase
      .from('grammar_questions')
      .select('*')
      .eq('lesson_id', params.lessonId)
      .order('id'),
  ])

  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
        <h1 className="font-serif text-2xl mb-3">Lesson coming soon</h1>
        <p className="text-muted mb-6">
          This lesson is planned but not yet written. Check back later!
        </p>
        <Link
          href="/grammar"
          className="text-terracotta hover:underline text-sm"
        >
          ← Back to Grammar
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-paper flex-shrink-0">
        <Link href="/grammar" className="text-muted hover:text-ink transition-colors text-sm">
          ← Grammar
        </Link>
        <span className="text-border">|</span>
        <h1 className="font-serif text-base text-ink">{lesson.title}</h1>
        <span className="ml-auto text-xs px-2 py-0.5 rounded bg-sidebar text-muted border border-border">
          {lesson.level}
        </span>
      </div>

      <LessonRenderer
        lesson={lesson as GrammarLesson}
        questions={(questions ?? []) as GrammarQuestion[]}
        userId={authUser?.id ?? null}
      />
    </div>
  )
}
