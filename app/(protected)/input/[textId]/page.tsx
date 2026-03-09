import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import BilingualReader from '@/components/input/BilingualReader'
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
