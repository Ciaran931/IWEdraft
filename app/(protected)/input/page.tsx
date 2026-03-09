import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  A2: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  B1: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  B2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  C1: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  Native: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
}

const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1']

type TextRow = {
  id: string
  title: string
  level: string
  category: string
}

function TextCard({ text }: { text: TextRow }) {
  return (
    <Link
      href={`/input/${text.id}`}
      className="block bg-surface border border-border rounded-lg p-5 hover:border-terracotta transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <h2 className="font-serif text-base text-ink group-hover:text-terracotta transition-colors">
          {text.title}
        </h2>
        <span
          className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded ${
            LEVEL_COLORS[text.level] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          {text.level}
        </span>
      </div>
    </Link>
  )
}

export default async function InputPage() {
  const supabase = createClient()

  // Parallel queries: graded + immersion
  const [{ data: gradedData, error }, { data: immersionData }] = await Promise.all([
    supabase.from('texts').select('id, title, level, category').neq('category', 'immersion').order('level'),
    supabase.from('texts').select('id, title, level, category').eq('category', 'immersion').order('title'),
  ])

  const graded = (gradedData as TextRow[] | null) ?? []
  const immersion = (immersionData as TextRow[] | null) ?? []

  // Group graded texts by level
  const gradedByLevel: Record<string, TextRow[]> = {}
  for (const text of graded) {
    ;(gradedByLevel[text.level] ??= []).push(text)
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <h1 className="font-serif text-2xl mb-6">Reading Library</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded px-4 py-3 text-sm mb-4">
          Something went wrong loading texts. Please try again.
        </div>
      )}

      {/* Immersion — prioritized at top */}
      {immersion.length > 0 && (
        <section className="mb-10">
          <div className="mb-4">
            <h2 className="font-serif text-lg text-ink">Immersion</h2>
            <p className="text-sm text-muted mt-1">
              Native-level content — read for exposure, not study.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {immersion.map(text => <TextCard key={text.id} text={text} />)}
          </div>
        </section>
      )}

      {/* Graded Readers — sectioned by level */}
      <section>
        <h2 className="font-serif text-lg text-ink mb-4">Graded Readers</h2>
        {LEVELS.map(level => {
          const texts = gradedByLevel[level]
          if (!texts || texts.length === 0) return null
          return (
            <div key={level} className="mb-8">
              <h3 className="flex items-center gap-2 mb-3">
                <span
                  className={`text-xs font-semibold px-2 py-0.5 rounded ${
                    LEVEL_COLORS[level] ?? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {level}
                </span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {texts.map(text => <TextCard key={text.id} text={text} />)}
              </div>
            </div>
          )
        })}
        {graded.length === 0 && (
          <p className="text-muted py-8 text-center">No graded texts available yet.</p>
        )}
      </section>
    </div>
  )
}
