import { createClient } from '@/lib/supabase/server'
import AuthProvider from './AuthProvider'
import Navbar from '@/components/nav/Navbar'
import type { User } from '@/lib/types'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  const profile: User | null = authUser
    ? ((await supabase.from('users').select('id, email, language_code, level, streak_days, last_active_at').eq('id', authUser.id).single()).data as User | null)
    : null

  return (
    <AuthProvider user={profile}>
      <div className="h-screen flex flex-col bg-paper">
        <Navbar />
        <main className="flex-1 flex flex-col overflow-y-auto pb-16 md:pb-0">{children}</main>
      </div>
    </AuthProvider>
  )
}
