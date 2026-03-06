import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const LEVEL_COLORS: Record<string, string> = {
  A1: 'bg-green-100 text-green-800',
  A2: 'bg-green-100 text-green-800',
  B1: 'bg-blue-100 text-blue-800',
  B2: 'bg-blue-100 text-blue-800',
  C1: 'bg-purple-100 text-purple-800',
  C2: 'bg-purple-100 text-purple-800',
}

const LEVELS = ['All', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2']

export default async function InputPage({
  searchParams,
}: {
  searchParams: { level?: string }
}) {
  const supabase = createClient()
  const activeLevel = searchParams.level || 'All'

  let query = supabase
    .from('texts')
    .select('id, title, level, paragraphs')
    .order('level')

  if (activeLevel !== 'All') {
    query = query.eq('level', activeLevel)
  }

  const { data: texts, error } = await query

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      <h1 className="font-serif text-2xl mb-6">Reading Library</h1>

      {/* Level filter pills */}
      <div className="flex flex-wrap gap-2 mb-6">
        {LEVELS.map(level => (
          <Link
            key={level}
            href={level === 'All' ? '/input' : `/input?level=${level}`}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              activeLevel === level
                ? 'bg-terracotta text-white border-terracotta'
                : 'bg-white text-muted border-border hover:border-terracotta hover:text-terracotta'
            }`}
          >
            {level}
          </Link>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded px-4 py-3 text-sm mb-4">
          Something went wrong loading texts. Please try again.
        </div>
      )}

      {/* Text grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {texts?.map(text => {
          const firstSentence =
            text.paragraphs?.[0]?.sentences?.[0] ?? ''
          const excerpt =
            firstSentence.length > 80
              ? firstSentence.slice(0, 80) + '…'
              : firstSentence

          return (
            <Link
              key={text.id}
              href={`/input/${text.id}`}
              className="block bg-white border border-border rounded-lg p-5 hover:border-terracotta transition-colors group"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h2 className="font-serif text-base text-ink group-hover:text-terracotta transition-colors">
                  {text.title}
                </h2>
                <span
                  className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded ${
                    LEVEL_COLORS[text.level] ?? 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {text.level}
                </span>
              </div>
              {excerpt && <p className="text-sm text-muted leading-relaxed">{excerpt}</p>}
            </Link>
          )
        })}

        {texts?.length === 0 && (
          <p className="text-muted col-span-2 py-8 text-center">
            No texts found at this level.
          </p>
        )}
      </div>
    </div>
  )
}
