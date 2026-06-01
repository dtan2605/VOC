import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpenText,
  ChevronLeft,
  ChevronRight,
  Layers3,
  Sparkles,
  Volume2,
} from 'lucide-react'
import MainLayout from '../../layouts/MainLayout'
import { useAuth } from '../../hooks/useAuth'
import { vocabApi } from '../../api/vocabApi'
import type { Band, Topic, VocabularyAiSuggestion, VocabularyItem } from '../../types/vocabulary'

function pronounceWord(word: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !word.trim()) {
    return
  }

  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(word)
  utterance.lang = 'en-US'
  utterance.rate = 0.92
  utterance.pitch = 1
  window.speechSynthesis.speak(utterance)
}

function BandProgress({ bands }: { bands: Band[] }) {
  const maxCount = Math.max(...bands.map((band) => band.vocabularyCount), 1)

  return (
    <div className="voc-pop-in rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--voc-accent)]/70">
            Band Progress
          </p>
          <h2
            className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Distribution across IELTS levels
          </h2>
        </div>
        <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
          <Layers3 size={18} />
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {bands.map((band) => {
          const width = `${Math.max((band.vocabularyCount / maxCount) * 100, band.vocabularyCount > 0 ? 10 : 0)}%`

          return (
            <div key={band.id}>
              <div className="mb-2 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--voc-text)]">{band.name}</p>
                  <p className="text-xs text-[var(--voc-text-soft)]">{band.description || 'IELTS level bucket'}</p>
                </div>
                <span className="rounded-full bg-[var(--voc-accent-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--voc-accent)]">
                  {band.vocabularyCount} words
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-[var(--voc-surface-strong)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(135deg,var(--voc-accent-strong)_0%,var(--voc-accent)_42%,var(--voc-accent-bright)_100%)] shadow-[0_8px_18px_var(--voc-shadow-soft)] transition-all duration-700"
                  style={{ width }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function VocabularyDetailPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const { isAuthenticated } = useAuth()

  const [item, setItem] = useState<VocabularyItem | null>(null)
  const [relatedItems, setRelatedItems] = useState<VocabularyItem[]>([])
  const [bands, setBands] = useState<Band[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [aiInsight, setAiInsight] = useState<VocabularyAiSuggestion | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [isMeaningVisible, setIsMeaningVisible] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (!id) {
      navigate('/vocabulary', { replace: true })
      return
    }

    void (async () => {
      setIsLoading(true)
      setError(null)

      try {
        const detail = await vocabApi.getVocabularyById(Number(id))
        const [bandsResponse, topicsResponse, relatedResponse] = await Promise.all([
          vocabApi.getBands('', 1, 100),
          vocabApi.getTopics('', 1, 100),
          vocabApi.getVocabulary({
            page: 1,
            pageSize: 12,
            bandId: detail.bandId,
          }),
        ])

        setItem(detail)
        setBands(bandsResponse.items)
        setTopics(topicsResponse.items)
        setRelatedItems(
          [detail, ...relatedResponse.items.filter((candidate) => candidate.id !== detail.id)].slice(0, 8)
        )

        try {
          const suggestion = await vocabApi.suggestVocabulary({ word: detail.word })
          setAiInsight(suggestion)
        } catch {
          setAiInsight(null)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load vocabulary detail.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    })()
  }, [id, navigate])

  const activeCard = relatedItems[activeCardIndex] ?? item
  const currentTopic = useMemo(
    () => topics.find((topic) => topic.id === item?.topicId) ?? null,
    [item?.topicId, topics]
  )

  useEffect(() => {
    setActiveCardIndex(0)
    setIsMeaningVisible(false)
  }, [item?.id])

  const hero = item ? (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="voc-shimmer voc-pop-in rounded-[30px] bg-[linear-gradient(135deg,var(--voc-accent-strong)_0%,var(--voc-accent)_42%,var(--voc-accent-bright)_100%)] p-6 text-white shadow-[0_28px_54px_rgba(134,16,39,0.24)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 backdrop-blur-md">
          <Sparkles size={14} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
            Vocabulary Detail Experience
          </span>
        </div>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <h2
            className="text-[34px] font-black leading-tight tracking-[-0.05em]"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {item.word}
          </h2>
          <button
            type="button"
            onClick={() => pronounceWord(item.word)}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/12 px-4 py-2 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
          >
            <Volume2 size={15} />
            Pronounce
          </button>
        </div>
        <p className="mt-3 text-sm font-medium uppercase tracking-[0.14em] text-white/74">
          {item.pronunciation || 'Pronunciation can be filled manually now and upgraded to audio service in Phase 4.2'}
        </p>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/82">{item.meaning}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
        {[
          ['Band', item.bandName],
          ['Topic', item.topicName],
          ['Examples', item.examples.length.toString()],
        ].map(([label, value]) => (
          <div key={label} className="voc-pop-in voc-hover-rise rounded-[28px] border border-[var(--voc-border)] bg-[var(--voc-panel)] px-5 py-5 shadow-[0_14px_40px_var(--voc-shadow-soft)]">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--voc-text-soft)]">{label}</p>
            <p
              className="mt-3 text-2xl font-black text-[var(--voc-text)]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  ) : null

  return (
    <MainLayout
      eyebrow="Phase 2.2 Vocabulary UX"
      title="A richer vocabulary experience with detail, flashcards, and speech."
      description="More detail for each word."
      hero={hero}
      actionSlot={
        <button
          type="button"
          onClick={() => navigate('/vocabulary')}
          className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)]"
        >
          <ArrowLeft size={15} />
          Back to library
        </button>
      }
    >
      {error && (
        <div className="mb-6 rounded-3xl border border-[var(--voc-border)] bg-[var(--voc-accent-soft)] px-5 py-4 text-sm text-[var(--voc-accent)]">
          {error}
        </div>
      )}

      {isLoading || !item ? (
        <section className="rounded-[32px] border border-dashed border-[var(--voc-border)] bg-[var(--voc-panel)] px-5 py-20 text-center text-sm text-[var(--voc-text-soft)]">
          Loading vocabulary experience...
        </section>
      ) : (
        <section className="grid gap-6 2xl:grid-cols-[1.08fr_0.92fr]">
          <div className="space-y-6">
            <div className="voc-pop-in rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)]">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--voc-accent)]/70">
                    Vocabulary Detail
                  </p>
                  <h2
                    className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Meaning, usage, and study context
                  </h2>
                </div>
                <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
                  <BookOpenText size={18} />
                </div>
              </div>

              <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
                <div className="voc-hover-rise rounded-[28px] bg-[var(--voc-panel-muted)] p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--voc-accent)]/70">
                    Core Definition
                  </p>
                  <h3
                    className="mt-3 text-3xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {item.word}
                  </h3>
                  <p className="mt-2 text-sm font-medium text-[var(--voc-text-soft)]">
                    {item.partOfSpeech || 'Vocabulary item'}
                  </p>
                  <p className="mt-5 text-sm leading-7 text-[var(--voc-text)]">{item.meaning}</p>

                  <div className="mt-5 flex flex-wrap gap-2">
                    <span className="rounded-full bg-[var(--voc-accent-soft)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--voc-accent)]">
                      {item.bandName}
                    </span>
                    <span
                      className="rounded-full border border-[var(--voc-border)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--voc-text)]"
                      style={{ backgroundColor: currentTopic?.colorHex ? `${currentTopic.colorHex}18` : 'white' }}
                    >
                      {item.topicName}
                    </span>
                  </div>
                </div>

                <div className="voc-hover-rise rounded-[28px] border border-[var(--voc-border)] bg-white p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--voc-accent)]/70">
                    Example Sentences
                  </p>
                  <div className="mt-4 space-y-3">
                    {item.examples.length > 0 ? (
                      item.examples.map((example) => (
                        <div key={example.id} className="rounded-2xl bg-[var(--voc-accent-soft)]/60 px-4 py-4">
                          <p className="text-sm font-medium leading-7 text-[var(--voc-text)]">
                            {example.englishText}
                          </p>
                          {example.vietnameseMeaning && (
                            <p className="mt-2 text-sm leading-6 text-[var(--voc-text-soft)]">
                              {example.vietnameseMeaning}
                            </p>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="rounded-2xl border border-dashed border-[var(--voc-border)] px-4 py-8 text-sm text-[var(--voc-text-soft)]">
                        No example sentences yet for this word.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {aiInsight && (
              <div className="voc-pop-in rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)]">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--voc-accent)]/70">
                      Word Family
                    </p>
                    <h2
                      className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
                      style={{ fontFamily: "'Montserrat', sans-serif" }}
                    >
                      Related forms and meaning options
                    </h2>
                  </div>
                  <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
                    <Sparkles size={18} />
                  </div>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-2">
                  <div className="rounded-[28px] bg-[var(--voc-panel-muted)] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--voc-accent)]/70">
                      Preferred meanings
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {aiInsight.meaningCandidates.length > 0 ? (
                        aiInsight.meaningCandidates.map((candidate) => (
                          <span
                            key={candidate}
                            className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-[var(--voc-text)]"
                          >
                            {candidate}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-[var(--voc-text-soft)]">
                          No ranked meanings are available yet.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[28px] bg-[var(--voc-panel-muted)] p-5">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--voc-accent)]/70">
                      Other forms
                    </p>
                    <div className="mt-4 grid gap-3">
                      {aiInsight.relatedForms.length > 0 ? (
                        aiInsight.relatedForms.map((form) => (
                          <div
                            key={`${form.word}-${form.partOfSpeech}`}
                            className="rounded-2xl bg-white px-4 py-3"
                          >
                            <p className="text-sm font-semibold text-[var(--voc-text)]">{form.word}</p>
                            <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[var(--voc-text-soft)]">
                              {form.partOfSpeech}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-[var(--voc-text-soft)]">
                          No alternate word forms were detected for this entry.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-[28px] bg-[var(--voc-panel-muted)] p-5 lg:col-span-2">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--voc-accent)]/70">
                      Synonyms
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {aiInsight.synonyms.length > 0 ? (
                        aiInsight.synonyms.map((synonym) => (
                          <span
                            key={synonym}
                            className="rounded-full bg-white px-3 py-2 text-sm font-semibold text-[var(--voc-text)]"
                          >
                            {synonym}
                          </span>
                        ))
                      ) : (
                        <p className="text-sm text-[var(--voc-text-soft)]">
                          No close synonyms were detected for this entry.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="voc-pop-in rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--voc-accent)]/70">
                    Flashcard Studio
                  </p>
                  <h2
                    className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    Review nearby words in the same level
                  </h2>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCardIndex((current) => (current - 1 + relatedItems.length) % relatedItems.length)
                      setIsMeaningVisible(false)
                    }}
                    className="rounded-2xl border border-[var(--voc-border)] bg-white p-3 text-[var(--voc-text)]"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveCardIndex((current) => (current + 1) % relatedItems.length)
                      setIsMeaningVisible(false)
                    }}
                    className="rounded-2xl border border-[var(--voc-border)] bg-white p-3 text-[var(--voc-text)]"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              {activeCard && (
                <div className="mt-6">
                  <div className="voc-pop-in relative overflow-hidden rounded-[34px] border border-[var(--voc-border)] bg-[linear-gradient(160deg,#ffffff_0%,#fff6f7_55%,#ffe9ee_100%)] p-6 shadow-[0_24px_60px_var(--voc-shadow-soft)]">
                    <div className="absolute -right-10 -top-10 h-36 w-36 rounded-full bg-[var(--voc-accent)]/10 blur-2xl" />
                    <div className="absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-[var(--voc-accent-bright)]/12 blur-2xl" />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between gap-3">
                        <span className="rounded-full bg-[var(--voc-accent-soft)] px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--voc-accent)]">
                          Card {activeCardIndex + 1} / {relatedItems.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => pronounceWord(activeCard.word)}
                          className="inline-flex items-center gap-2 rounded-full border border-[var(--voc-border)] bg-white/80 px-4 py-2 text-sm font-semibold text-[var(--voc-text)]"
                        >
                          <Volume2 size={15} />
                          Hear it
                        </button>
                      </div>

                      <div className="mt-10 min-h-[240px] rounded-[28px] bg-white/76 p-6 backdrop-blur-sm">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--voc-text-soft)]">
                          Front side
                        </p>
                        <h3
                          className="mt-4 text-[40px] font-black tracking-[-0.06em] text-[var(--voc-text)]"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {activeCard.word}
                        </h3>
                        <p className="mt-3 text-sm uppercase tracking-[0.14em] text-[var(--voc-accent)]/70">
                          {activeCard.partOfSpeech || 'Vocabulary'} · {activeCard.bandName}
                        </p>

                        {isMeaningVisible ? (
                          <div className="voc-fade-up mt-8 rounded-[24px] bg-[var(--voc-accent-soft)]/70 p-5">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--voc-accent)]/70">
                              Back side
                            </p>
                            <p className="mt-3 text-sm leading-7 text-[var(--voc-text)]">
                              {activeCard.meaning}
                            </p>
                            {activeCard.examples[0]?.englishText && (
                              <p className="mt-4 text-sm italic leading-7 text-[var(--voc-text-soft)]">
                                "{activeCard.examples[0].englishText}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="mt-8 rounded-[24px] border border-dashed border-[var(--voc-border)] px-5 py-8 text-sm text-[var(--voc-text-soft)]">
                            Tap reveal to flip the card and inspect the meaning.
                          </div>
                        )}
                      </div>

                      <div className="mt-5 flex flex-wrap gap-3">
                        <button
                          type="button"
                          onClick={() => setIsMeaningVisible((current) => !current)}
                          className="rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)]"
                        >
                          {isMeaningVisible ? 'Hide meaning' : 'Reveal meaning'}
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate(`/vocabulary/${activeCard.id}`)}
                          className="rounded-2xl border border-[var(--voc-border)] bg-white px-5 py-3 text-sm font-semibold text-[var(--voc-text)]"
                        >
                          Open this word
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="voc-pop-in">
              <BandProgress bands={bands} />
            </div>
          </div>
        </section>
      )}
    </MainLayout>
  )
}
