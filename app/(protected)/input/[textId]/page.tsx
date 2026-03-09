import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BilingualReader from '@/components/input/BilingualReader'
import Link from 'next/link'
import type { Text, TextTranslation, TextQuestion, User } from '@/lib/types'

export default async function TextPage({ params }: { params: { textId: string } }) {
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  // Merge into one parallel batch — questions don't depend on profile
  const [{ data: text }, profileResult, { data: questions }] = await Promise.all([
    supabase.from('texts').select('*').eq('id', params.textId).single(),
    authUser
      ? supabase.from('users').select('id, language_code').eq('id', authUser.id).single()
      : Promise.resolve({ data: null }),
    supabase
      .from('text_questions')
      .select('*')
      .eq('text_id', params.textId)
      .order('sort_order'),
  ])

  if (!text) notFound()

  const profile = profileResult.data as User | null
  const langCode = profile?.language_code ?? 'pl'

  const { data: translation } = await supabase
    .from('text_translations')
    .select('*')
    .eq('text_id', params.textId)
    .eq('language_code', langCode)
    .single()

  const comprehensionQuestions = (questions ?? []).filter(
    (q: TextQuestion) => q.question_type === 'comprehension'
  )
  const discussionQuestions = (questions ?? []).filter(
    (q: TextQuestion) => q.question_type === 'discussion'
  )

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Back + title header */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-border bg-paper flex-shrink-0">
        <Link href="/input" className="text-muted hover:text-ink transition-colors text-sm">
          ← Library
        </Link>
        <span className="text-border">|</span>
        <h1 className="font-serif text-base text-ink truncate">{text.title}</h1>
        <span className="text-xs px-2 py-0.5 rounded bg-sidebar text-muted border border-border ml-auto">
          {text.level}
        </span>
      </div>

      <BilingualReader
        text={text as Text}
        translation={translation as TextTranslation | null}
        user={profile}
        comprehensionQuestions={comprehensionQuestions}
        discussionQuestions={discussionQuestions}
      />
    </div>
  )
}
