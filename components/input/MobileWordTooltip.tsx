'use client'

import { forwardRef, useLayoutEffect, useRef, useState } from 'react'
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
  anchorRect: { top: number; left: number; width: number; height: number }
  onDismiss: () => void
}

type AddState = 'idle' | 'adding' | 'added' | 'exists'

const MobileWordTooltip = forwardRef<HTMLDivElement, Props>(
  ({ wordData, languageCode, textId, userId, sentence, anchorRect, onDismiss }, ref) => {
    const innerRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()
    const router = useRouter()
    const [addState, setAddState] = useState<AddState>('idle')
    const [flipAbove, setFlipAbove] = useState(false)
    const [shiftLeft, setShiftLeft] = useState(0)

    useLayoutEffect(() => {
      setFlipAbove(false)
      setShiftLeft(0)
    }, [anchorRect])

    useLayoutEffect(() => {
      const el = innerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.bottom > window.innerHeight - 16) setFlipAbove(true)
      if (rect.right > window.innerWidth - 8) setShiftLeft(rect.right - window.innerWidth + 16)
    }, [anchorRect, flipAbove])

    const style: React.CSSProperties = flipAbove
      ? { position: 'absolute', bottom: `calc(100% - ${anchorRect.top}px + 6px)`, left: anchorRect.left - shiftLeft }
      : { position: 'absolute', top: anchorRect.top + anchorRect.height + 6, left: anchorRect.left - shiftLeft }

    async function handleAddFlashcard() {
      if (!wordData) return
      if (!userId) { router.push('/login'); return }
      setAddState('adding')
      const { word } = wordData
      const enDefinition = wordData.override?.en_definition ?? word.en_definition

      const { data: existing } = await supabase
        .from('srs_cards').select('id')
        .eq('user_id', userId).eq('content_id', word.id).eq('source_text_id', textId)
        .maybeSingle()
      if (existing) { setAddState('exists'); return }

      let deckId: string
      const { data: existingDeck } = await supabase
        .from('srs_decks').select('id')
        .eq('user_id', userId).eq('name', 'My Words').maybeSingle()

      if (existingDeck) {
        deckId = existingDeck.id
      } else {
        const { data: newDeck, error } = await supabase
          .from('srs_decks').insert({ user_id: userId, name: 'My Words', deck_type: 'custom', language_code: 'en' })
          .select('id').single()
        if (error || !newDeck) { setAddState('idle'); return }
        deckId = newDeck.id
      }

      const { error } = await supabase.from('srs_cards').insert({
        user_id: userId, card_type: 'vocab', content_id: word.id, deck_id: deckId,
        source_text_id: textId, source_sentence: sentence ?? null,
        context_definition: enDefinition, status: 'new', due_date: new Date().toISOString(),
        ease_factor: 2.5, interval: 1, repetitions: 0,
      })
      setAddState(error ? 'idle' : 'added')
    }

    const translation = wordData
      ? (wordData.override?.translations?.[languageCode]?.word ?? wordData.word.translations?.[languageCode]?.word ?? '—')
      : ''
    const enDefinition = wordData
      ? (wordData.override?.en_definition ?? wordData.word.en_definition)
      : ''

    return (
      <div ref={ref} className="md:hidden" style={style}>
        <div ref={innerRef} className="bg-paper border border-border rounded-lg shadow-lg p-3 max-w-[280px] z-50">
          {!wordData ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-5 bg-border rounded w-20" />
              <div className="h-4 bg-border rounded w-32" />
              <div className="h-4 bg-border rounded w-full" />
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-base font-semibold text-ink">{wordData.word.word}</span>
                <span className="text-xs text-muted italic">{wordData.word.pos}</span>
                <button onClick={onDismiss} className="ml-auto text-muted hover:text-ink text-lg leading-none">&times;</button>
              </div>
              <p className="text-sm font-medium text-terracotta">{translation}</p>
              {enDefinition && <p className="text-xs text-muted">{enDefinition}</p>}
              <button
                onClick={handleAddFlashcard}
                disabled={addState !== 'idle'}
                className={`w-full py-1.5 rounded text-xs font-medium transition-colors ${
                  addState === 'added' ? 'bg-srs-mature text-white'
                  : addState === 'exists' ? 'bg-sidebar text-muted border border-border cursor-default'
                  : 'bg-terracotta text-white hover:bg-terracotta-light disabled:opacity-60'
                }`}
              >
                {addState === 'adding' ? 'Adding...' : addState === 'added' ? 'Added' : addState === 'exists' ? 'Already saved' : '+ Flashcard'}
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }
)

MobileWordTooltip.displayName = 'MobileWordTooltip'
export default MobileWordTooltip
