import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function RootPage() {
  const supabase = createClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-paper flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-border">
        <Link href="/" className="font-serif text-lg text-ink hover:text-terracotta transition-colors">Input With Ease</Link>
        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm text-muted hover:text-ink transition-colors">
            Sign in
          </Link>
          <Link
            href="/signup"
            className="bg-terracotta text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-terracotta-light transition-colors"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        <div className="max-w-2xl mb-16">
          <h1 className="font-serif text-4xl md:text-5xl text-ink mb-4 leading-tight">
            Learn English the natural way
          </h1>
          <p className="text-lg text-muted mb-8 max-w-lg mx-auto leading-relaxed">
            Build real fluency through comprehensible input. Read stories at your level,
            absorb vocabulary in context, and let spaced repetition do the heavy lifting.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="bg-terracotta text-white px-6 py-2.5 rounded font-medium hover:bg-terracotta-light transition-colors"
            >
              Start learning for free
            </Link>
            <Link
              href="/input"
              className="border border-border px-6 py-2.5 rounded text-ink hover:bg-sidebar transition-colors"
            >
              Browse the library
            </Link>
          </div>
        </div>
      </main>

      {/* How it works */}
      <section className="border-t border-border bg-surface px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl text-ink text-center mb-10">How it works</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center mx-auto mb-3 text-lg font-serif">
                1
              </div>
              <h3 className="font-medium text-ink mb-2">Read at your level</h3>
              <p className="text-sm text-muted">
                Graded stories from A1 to C1, plus native immersion content. Every text is crafted for comprehension.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center mx-auto mb-3 text-lg font-serif">
                2
              </div>
              <h3 className="font-medium text-ink mb-2">Save words in context</h3>
              <p className="text-sm text-muted">
                Tap any word while reading to see its definition and save it. You learn meaning from the story, not a word list.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-terracotta/10 text-terracotta flex items-center justify-center mx-auto mb-3 text-lg font-serif">
                3
              </div>
              <h3 className="font-medium text-ink mb-2">Review with SRS</h3>
              <p className="text-sm text-muted">
                Spaced repetition shows you words and grammar right before you forget them. Efficient and automatic.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-6 text-center">
        <p className="text-xs text-muted">Input With Ease</p>
      </footer>
    </div>
  )
}
