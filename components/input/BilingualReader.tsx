'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import WordPanel from './WordPanel'
import MobileWordTooltip from './MobileWordTooltip'
import ComprehensionQuiz from './ComprehensionQuiz'
import { useIsMobile } from '@/hooks/useIsMobile'
import Link from 'next/link'
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

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
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
      {/* Header row */}
      <div className="flex items-center px-6 py-2 flex-shrink-0">
        <Link href="/input" className="text-muted hover:text-ink transition-colors text-sm">
          ← Library
        </Link>
        <span className="text-border mx-2">|</span>
        <h1 className="font-serif text-base text-ink truncate">{text.title}</h1>
        <span className="text-xs px-2 py-0.5 rounded bg-sidebar text-muted border border-border ml-auto">
          {text.level}
        </span>
        <button
          onClick={() => setHideTranslation(h => !h)}
          className={`ml-3 text-xs px-3 py-1.5 rounded border transition-colors ${
            hideTranslation
              ? 'bg-terracotta text-white border-terracotta'
              : 'bg-paper text-muted border-border hover:border-terracotta'
          }`}
        >
          {hideTranslation ? 'Focus ON' : 'Focus'}
        </button>
      </div>

      {/* Tab selector */}
      <div className="flex justify-center gap-4 px-6 pb-3 flex-shrink-0">
        {(['read', 'understand', 'discuss'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => { dismissTooltip(); setActiveTab(tab) }}
            className={`px-6 py-2 text-sm font-medium capitalize rounded border transition-colors ${
              activeTab === tab
                ? 'bg-terracotta text-white border-terracotta'
                : 'bg-surface text-muted border-border hover:text-ink hover:border-ink'
            }`}
          >
            {tab}
          </button>
        ))}
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

          {/* Mobile: interleaved paragraphs */}
          <div className="md:hidden flex-1 overflow-hidden flex flex-col">
            <div
              ref={scrollContainerRef}
              className="flex-1 overflow-y-auto relative p-6"
            >
              {text.paragraphs.map(para => (
                <div key={para.id} className="mb-8">
                  {para.sentences.map((sentence, sIdx) =>
                    renderSentence(sentence, para.id, sIdx + 1)
                  )}
                  {!hideTranslation && translation?.paragraphs
                    .find(p => p.id === para.id)
                    ?.sentences.map((sentence, sIdx) => {
                      const sentenceId = sIdx + 1
                      const isHighlighted =
                        clicked?.paraId === para.id && clicked?.sentenceId === sentenceId
                      return (
                        <p
                          key={`tr-${sentenceId}`}
                          className={`mb-2 leading-relaxed text-sm text-terracotta-muted transition-colors rounded px-0.5 ${
                            isHighlighted ? 'sentence-highlight' : ''
                          }`}
                        >
                          {sentence}
                        </p>
                      )
                    })}
                </div>
              ))}
              {tooltipAnchorRect && clicked && (
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
        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
          <div className="max-w-2xl mx-auto">
            <h2 className="font-serif text-xl mb-6 text-center">Comprehension Questions</h2>
            {comprehensionQuestions.length === 0 ? (
              <p className="text-muted italic text-sm">
                Comprehension questions for this text are coming soon.
              </p>
            ) : (
              <ComprehensionQuiz questions={comprehensionQuestions} />
            )}
          </div>
        </div>
      )}

      {activeTab === 'discuss' && (
        <div className="flex-1 overflow-y-auto no-scrollbar p-8">
          <div className="max-w-2xl mx-auto">
          <h2 className="font-serif text-xl mb-6 text-center">Discussion Questions</h2>
          {discussionQuestions.length === 0 ? (
            <p className="text-muted italic text-sm text-center">
              Discussion questions for this text are coming soon.
            </p>
          ) : (
            <div className="space-y-5">
              {discussionQuestions.map((q, i) => (
                <div key={q.id} className="bg-surface rounded border border-border/60 shadow-sm px-6 py-5">
                  <p className="font-serif text-sm text-muted text-center">{i + 1}.</p>
                  <p className="mt-1 text-ink leading-relaxed">{q.question}</p>
                </div>
              ))}
            </div>
          )}
          </div>
        </div>
      )}
    </div>
  )
}
