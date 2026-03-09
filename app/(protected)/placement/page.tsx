import { createClient } from '@/lib/supabase/server'
import PlacementQuiz from '@/components/placement/PlacementQuiz'

export default async function PlacementPage() {
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()
  if (!authUser) return null

  return (
    <div className="p-6 max-w-2xl mx-auto w-full">
      <h1 className="font-serif text-2xl mb-2">Placement Quiz</h1>
      <p className="text-muted text-sm mb-6">
        Answer these questions to find your level. Lower-level grammar will be marked as known
        so you can focus on what matters.
      </p>
      <PlacementQuiz userId={authUser.id} />
    </div>
  )
}
