'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import WordPanel from './WordPanel'
import ComprehensionQuiz from './ComprehensionQuiz'
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

  const [clicked, setClicked] = useState<ClickedWord | null>(null)
  const [wordData, setWordData] = useState<WordData | null>(null)
  const [hideTranslation, setHideTranslation] = useState(false)
  const [activeTab, setActiveTab] = useState<'read' | 'understand' | 'discuss'>('read')

  const handleWordClick = useCallback(
    async (wordId: string, paraId: number, sentenceId: number, sentence: string) => {
      setClicked({ wordId, paraId, sentenceId, sentence })

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
    [supabase, text.id]
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
              onClick={() => handleWordClick(wordId, paraId, sentenceId, sentence)}
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
            onClick={() => setActiveTab(tab)}
            className={`px-5 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-terracotta text-terracotta'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab}
          </button>
        ))}

        <div className="ml-auto px-4">
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

          {/* Bilingual text */}
          <div className="flex-1 overflow-y-auto">
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
