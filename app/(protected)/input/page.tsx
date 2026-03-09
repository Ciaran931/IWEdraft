import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  A2: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  B1: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  B2: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  C1: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  C2: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  Native: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
}

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']

type TextRow = {
  id: string
  title: string
  level: string
  category: string
  paragraphs: { id: number; sentences: string[] }[]
}

function TextCard({ text }: { text: TextRow }) {
  const firstSentence = text.paragraphs?.[0]?.sentences?.[0] ?? ''
  const excerpt =
    firstSentence.length > 80 ? firstSentence.slice(0, 80) + '…' : firstSentence

  return (
    <Link
      href={`/input/${text.id}`}
      className="block bg-surface border border-border rounded-lg p-5 hover:border-terracotta transition-colors group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
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
      {excerpt && <p className="text-sm text-muted leading-relaxed">{excerpt}</p>}
    </Link>
  )
}

export default async function InputPage({
  searchParams,
}: {
  searchParams: { level?: string }
}) {
  const supabase = createClient()
  const activeLevel = searchParams.level || 'All'

  const { data: texts, error } = await supabase
    .from('texts')
    .select('id, title, level, category, paragraphs')
    .order('level')

  const graded = (texts as TextRow[] | null)?.filter(t => t.category !== 'immersion') ?? []
  const immersion = (texts as TextRow[] | null)?.filter(t => t.category === 'immersion') ?? []

  const filteredGraded =
    activeLevel === 'All' ? graded : graded.filter(t => t.level === activeLevel)

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <h1 className="font-serif text-2xl mb-6">Reading Library</h1>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded px-4 py-3 text-sm mb-4">
          Something went wrong loading texts. Please try again.
        </div>
      )}

      {/* Graded Readers */}
      <section className="mb-10">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="font-serif text-lg text-ink">Graded Readers</h2>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map(level => (
              <Link
                key={level}
                href={level === 'All' ? '/input' : `/input?level=${level}`}
                className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
                  activeLevel === level
                    ? 'bg-terracotta text-white border-terracotta'
                    : 'bg-surface text-muted border-border hover:border-terracotta hover:text-terracotta'
                }`}
              >
                {level}
              </Link>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredGraded.map(text => <TextCard key={text.id} text={text} />)}
          {filteredGraded.length === 0 && (
            <p className="text-muted col-span-2 py-8 text-center">
              No texts found at this level.
            </p>
          )}
        </div>
      </section>

      {/* Immersion */}
      {immersion.length > 0 && (
        <section>
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
    </div>
  )
}
