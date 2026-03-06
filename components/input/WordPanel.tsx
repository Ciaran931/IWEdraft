'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { VocabWord, TextWordOverride } from '@/lib/types'

interface WordData {
  word: VocabWord
  override: TextWordOverride | null
}

interface Props {
  wordData: WordData | null
  languageCode: string
  textId: string
  userId: string | null
  sentence?: string
}

type AddState = 'idle' | 'adding' | 'added' | 'exists'

export default function WordPanel({ wordData, languageCode, textId, userId, sentence }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const [addState, setAddState] = useState<AddState>('idle')

  if (!wordData) {
    return (
      <div className="p-5">
        <p className="text-sm text-muted italic">Click a word to see details</p>
      </div>
    )
  }

  const { word, override } = wordData

  const translation = override?.translations?.[languageCode]?.word
    ?? word.translations?.[languageCode]?.word
    ?? '—'

  const enDefinition = override?.en_definition ?? word.en_definition
  const plDefinition = override?.translations?.[languageCode]?.definition
    ?? word.translations?.[languageCode]?.definition
    ?? '—'

  async function handleAddFlashcard() {
    if (!userId) {
      router.push('/login')
      return
    }
    setAddState('adding')

    // Check if card already exists
    const { data: existing } = await supabase
      .from('srs_cards')
      .select('id')
      .eq('user_id', userId)
      .eq('content_id', word.id)
      .eq('source_text_id', textId)
      .maybeSingle()

    if (existing) {
      setAddState('exists')
      return
    }

    // Ensure "My Words" deck exists
    let deckId: string
    const { data: existingDeck } = await supabase
      .from('srs_decks')
      .select('id')
      .eq('user_id', userId)
      .eq('name', 'My Words')
      .maybeSingle()

    if (existingDeck) {
      deckId = existingDeck.id
    } else {
      const { data: newDeck, error } = await supabase
        .from('srs_decks')
        .insert({
          user_id: userId,
          name: 'My Words',
          deck_type: 'custom',
          language_code: 'en',
        })
        .select('id')
        .single()

      if (error || !newDeck) {
        setAddState('idle')
        return
      }
      deckId = newDeck.id
    }

    // Insert the card
    const { error } = await supabase.from('srs_cards').insert({
      user_id: userId,
      card_type: 'vocab',
      content_id: word.id,
      deck_id: deckId,
      source_text_id: textId,
      source_sentence: sentence ?? null,
      context_definition: enDefinition,
      status: 'new',
      due_date: new Date().toISOString(),
      ease_factor: 2.5,
      interval: 1,
      repetitions: 0,
    })

    setAddState(error ? 'idle' : 'added')
  }

  return (
    <div className="p-5 space-y-4">
      {/* Word header */}
      <div>
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="font-serif text-xl font-semibold text-ink">{word.word}</span>
          <span className="text-xs text-muted italic">{word.pos}</span>
        </div>
        <p className="text-sm font-medium text-terracotta">{translation}</p>
      </div>

      {/* Definitions */}
      <div className="space-y-2 text-sm">
        <div>
          <span className="font-medium text-ink">EN: </span>
          <span className="text-muted">{enDefinition}</span>
        </div>
        {plDefinition !== '—' && (
          <div>
            <span className="font-medium text-ink">PL: </span>
            <span className="text-muted">{plDefinition}</span>
          </div>
        )}
      </div>

      {/* Source sentence */}
      {sentence && (
        <div className="bg-sidebar border border-border rounded px-3 py-2 text-sm text-muted italic leading-relaxed">
          {sentence}
        </div>
      )}

      {/* Examples */}
      {word.examples && word.examples.length > 0 && (
        <div className="text-sm">
          <p className="font-medium text-ink mb-1">Examples</p>
          <ol className="space-y-1 list-decimal list-inside text-muted">
            {word.examples.map((ex, i) => (
              <li key={i}>{ex}</li>
            ))}
          </ol>
        </div>
      )}

      {/* Add to Flashcards */}
      <button
        onClick={handleAddFlashcard}
        disabled={addState !== 'idle'}
        className={`w-full py-2 rounded text-sm font-medium transition-colors ${
          addState === 'added'
            ? 'bg-srs-mature text-white'
            : addState === 'exists'
            ? 'bg-sidebar text-muted border border-border cursor-default'
            : 'bg-terracotta text-white hover:bg-terracotta-light disabled:opacity-60'
        }`}
      >
        {addState === 'adding'
          ? 'Adding…'
          : addState === 'added'
          ? 'Added ✓'
          : addState === 'exists'
          ? 'Already in your deck'
          : '+ Add to Flashcards'}
      </button>
    </div>
  )
}
