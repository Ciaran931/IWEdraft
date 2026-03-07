'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import WordPanel from './WordPanel'
import MobileWordTooltip from './MobileWordTooltip'
import ComprehensionQuiz from './ComprehensionQuiz'
import { useIsMobile } from '@/hooks/useIsMobile'
import type { Text, TextTranslation, TextQuestion, VocabWord, TextWordOverride, User } from '@/lib/types'

interface ClickedWord {
  wordId: string
  paraId: number
  sentenceId: number
  sentence: string
}

interface WordData {
  word: VocabWord
  override: TextWordOverride | null
}

interface Props {
  text: Text
  translation: TextTranslation | null
  user: User | null
  comprehensionQuestions: TextQuestion[]
  discussionQuestions: TextQuestion[]
}

export default function BilingualReader({ text, translation, user, comprehensionQuestions, discussionQuestions }: Props) {
  const supabase = createClient()
  const isMobile = useIsMobile()

  const [clicked, setClicked] = useState<ClickedWord | null>(null)
  const [wordData, setWordData] = useState<WordData | null>(null)
  const [hideTranslation, setHideTranslation] = useState(false)
  const [activeTab, setActiveTab] = useState<'read' | 'understand' | 'discuss'>('read')
  const [tooltipLocked, setTooltipLocked] = useState(false)
  const [tooltipAnchorRect, setTooltipAnchorRect] = useState<{ top: number; left: number; width: number; height: number } | null>(null)
  const [mobileLang, setMobileLang] = useState<0 | 1>(0)

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef<number | null>(null)
  const touchStartY = useRef<number | null>(null)
  const justDismissedRef = useRef(false)

  function dismissTooltip() {
    setTooltipLocked(false)
    setTooltipAnchorRect(null)
    setClicked(null)
    setWordData(null)
  }

  // Outside-click listener in capture phase to prevent word clicks while tooltip is open
  useEffect(() => {
    if (!tooltipLocked) return
    function handler(e: MouseEvent | TouchEvent) {
      if (tooltipRef.current && tooltipRef.current.contains(e.target as Node)) return
      if (e.type === 'touchstart') {
        // Don't block touch events — let swipe gestures pass through
        justDismissedRef.current = true
        dismissTooltip()
        return
      }
      // For mouse: block to prevent word click
      e.preventDefault()
      e.stopPropagation()
      dismissTooltip()
    }
    document.addEventListener('mousedown', handler, true)
    document.addEventListener('touchstart', handler, true)
    return () => {
      document.removeEventListener('mousedown', handler, true)
      document.removeEventListener('touchstart', handler, true)
    }
  }, [tooltipLocked])

  const handleWordClick = useCallback(
    async (wordId: string, paraId: number, sentenceId: number, sentence: string, event?: React.MouseEvent) => {
      if (isMobile && justDismissedRef.current) {
        justDismissedRef.current = false
        return
      }

      setClicked({ wordId, paraId, sentenceId, sentence })
      setWordData(null)

      if (isMobile && event && scrollContainerRef.current) {
        const wordEl = event.currentTarget as HTMLElement
        const containerRect = scrollContainerRef.current.getBoundingClientRect()
        const wordRect = wordEl.getBoundingClientRect()
        setTooltipAnchorRect({
          top: wordRect.bottom - containerRect.top + scrollContainerRef.current.scrollTop,
          left: wordRect.left - containerRect.left,
          width: wordRect.width,
          height: wordRect.height,
        })
        setTooltipLocked(true)
      }

      const [{ data: word }, { data: override }] = await Promise.all([
        supabase.from('vocab_words').select('*').eq('id', wordId).maybeSingle(),
        supabase
          .from('text_word_overrides')
          .select('*')
          .eq('text_id', text.id)
          .eq('word_id', wordId)
          .maybeSingle(),
      ])

      setWordData(word ? { word: word as VocabWord, override: override as TextWordOverride | null } : null)
    },
    [supabase, text.id, isMobile]
  )

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
    touchStartY.current = e.touches[0].clientY
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return
    const deltaX = e.changedTouches[0].clientX - touchStartX.current
    const deltaY = e.changedTouches[0].clientY - touchStartY.current
    touchStartX.current = null
    touchStartY.current = null
    const SWIPE_THRESHOLD = 50
    // Only treat as swipe if movement is more horizontal than vertical
    if (Math.abs(deltaX) < SWIPE_THRESHOLD || Math.abs(deltaX) < Math.abs(deltaY)) return
    if (deltaX < 0 && mobileLang === 0) {
      setMobileLang(1)
      if (tooltipLocked) {
        setTooltipLocked(false)
        setTooltipAnchorRect(null)
        setWordData(null)
      }
    } else if (deltaX > 0 && mobileLang === 1) {
      setMobileLang(0)
    }
  }

  function renderSentence(sentence: string, paraId: number, sentenceId: number) {
    const isThisSentenceHighlighted =
      clicked?.paraId === paraId && clicked?.sentenceId === sentenceId

    return (
      <p
        key={sentenceId}
        className={`mb-2 leading-relaxed transition-colors rounded px-0.5 ${
          isThisSentenceHighlighted ? 'sentence-highlight' : ''
        }`}
      >
        {sentence.split(/(\b[a-zA-Z'''-]+\b)/).map((part, i) => {
          if (!/^[a-zA-Z'''-]+$/.test(part)) return <span key={i}>{part}</span>

          const wordId = part.toLowerCase().replace(/[^a-z''-]/g, '')
          const isSelected =
            clicked?.wordId === wordId &&
            clicked?.paraId === paraId &&
            clicked?.sentenceId === sentenceId

          return (
            <span
              key={i}
              className={`word${isSelected ? ' selected' : ''}`}
              onClick={(e) => handleWordClick(wordId, paraId, sentenceId, sentence, e)}
            >
              {part}
            </span>
          )
        })}
      </p>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Tab bar */}
      <div className="flex items-center border-b border-border bg-paper flex-shrink-0">
        {(['read', 'understand', 'discuss'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { dismissTooltip(); setActiveTab(tab) }}
            className={`px-5 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab}
          </button>
        ))}

        <div className="ml-auto px-4 hidden md:block">
          <button
            onClick={() => setHideTranslation(h => !h)}
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${
              hideTranslation
                ? 'bg-terracotta text-white border-terracotta'
                : 'bg-paper text-muted border-border hover:border-terracotta'
            }`}
          >
            {hideTranslation ? 'Hard Mode ON' : 'Hard Mode'}
          </button>
        </div>
      </div>

      {activeTab === 'read' && (
        <div className="flex flex-1 overflow-hidden">
          {/* Word panel sidebar (desktop) */}
          <div className="hidden md:flex flex-col w-72 flex-shrink-0 border-r border-border bg-sidebar overflow-y-auto">
            <div className="px-4 pt-4 pb-2 border-b border-border">
              <h2 className="font-serif text-sm text-muted uppercase tracking-wide">Word Info</h2>
            </div>
            <WordPanel
              wordData={wordData}
              languageCode={user?.language_code ?? 'en'}
              textId={text.id}
              userId={user?.id ?? null}
              sentence={clicked?.sentence}
            />
          </div>

          {/* Mobile: single scroll, swipe to toggle language */}
          <div className="md:hidden flex-1 overflow-hidden flex flex-col">
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto relative p-6"
              style={{ touchAction: 'pan-y' }}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {text.paragraphs.map(para => (
                <div key={para.id} className="mb-8">
                  {mobileLang === 0
                    ? para.sentences.map((sentence, sIdx) =>
                        renderSentence(sentence, para.id, sIdx + 1)
                      )
                    : translation?.paragraphs
                        .find(p => p.id === para.id)
                        ?.sentences.map((sentence, sIdx) => (
                          <p
                            key={sIdx + 1}
                            className={`mb-2 leading-relaxed text-muted transition-colors rounded px-0.5 ${
                              clicked?.paraId === para.id && clicked?.sentenceId === sIdx + 1 ? 'sentence-highlight' : ''
                            }`}
                          >
                            {sentence}
                          </p>
                        ))}
                </div>
              ))}
              {mobileLang === 0 && tooltipAnchorRect && clicked && (
                <MobileWordTooltip
                  ref={tooltipRef}
                  wordData={wordData}
                  languageCode={user?.language_code ?? 'en'}
                  textId={text.id}
                  userId={user?.id ?? null}
                  sentence={clicked.sentence}
                  anchorRect={tooltipAnchorRect}
                  onDismiss={dismissTooltip}
                />
              )}
            </div>
            {/* Dot indicator */}
            <div className="flex justify-center gap-2 py-2 bg-paper border-t border-border">
              <span className={`w-2 h-2 rounded-full ${mobileLang === 0 ? 'bg-terracotta' : 'bg-border'}`} />
              <span className={`w-2 h-2 rounded-full ${mobileLang === 1 ? 'bg-terracotta' : 'bg-border'}`} />
            </div>
          </div>

          {/* Desktop: side-by-side layout */}
          <div className="hidden md:block flex-1 overflow-y-auto relative">
            <div className="p-6 max-w-5xl">
              {text.paragraphs.map(para => (
                <div key={para.id} className={`mb-8 ${hideTranslation ? '' : 'grid grid-cols-2 gap-8'}`}>
                  {/* English */}
                  <div>
                    {para.sentences.map((sentence, sIdx) =>
                      renderSentence(sentence, para.id, sIdx + 1)
                    )}
                  </div>

                  {/* Translation */}
                  {!hideTranslation && (
                    <div>
                      {translation?.paragraphs
                        .find(p => p.id === para.id)
                        ?.sentences.map((sentence, sIdx) => {
                          const sentenceId = sIdx + 1
                          const isHighlighted =
                            clicked?.paraId === para.id && clicked?.sentenceId === sentenceId
                          return (
                            <p
                              key={sentenceId}
                              className={`mb-2 leading-relaxed text-muted transition-colors rounded px-0.5 ${
                                isHighlighted ? 'sentence-highlight' : ''
                              }`}
                            >
                              {sentence}
                            </p>
                          )
                        })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'understand' && (
        <div className="flex-1 overflow-y-auto p-8 max-w-2xl">
          <h2 className="font-serif text-xl mb-6">Comprehension Questions</h2>
          {comprehensionQuestions.length === 0 ? (
            <p className="text-muted italic text-sm">
              Comprehension questions for this text are coming soon.
            </p>
          ) : (
            <ComprehensionQuiz questions={comprehensionQuestions} />
          )}
        </div>
      )}

      {activeTab === 'discuss' && (
        <div className="flex-1 overflow-y-auto p-8 max-w-2xl">
          <h2 className="font-serif text-xl mb-6">Discussion Questions</h2>
          {discussionQuestions.length === 0 ? (
            <p className="text-muted italic text-sm">
              Discussion questions for this text are coming soon.
            </p>
          ) : (
            <ol className="space-y-4 list-decimal list-inside">
              {discussionQuestions.map(q => (
                <li key={q.id} className="text-ink leading-relaxed">{q.question}</li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  )
}
