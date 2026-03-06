import { createClient } from '@/lib/supabase/server'
import AuthProvider from './AuthProvider'
import Navbar from '@/components/nav/Navbar'
import type { User } from '@/lib/types'

export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  let profile: User | null = null
  if (authUser) {
    const { data } = await supabase.from('users').select('*').eq('id', authUser.id).single()
    profile = data as User | null
  }

  return (
    <AuthProvider user={profile}>
      <div className="h-screen flex flex-col bg-paper">
        <Navbar />
        <main className="flex-1 flex flex-col overflow-y-auto">{children}</main>
      </div>
    </AuthProvider>
  )
}
