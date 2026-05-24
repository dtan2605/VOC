import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookMarked,
  ChevronLeft,
  ChevronRight,
  Eye,
  Save,
  Search,
  Trash2,
  Volume2,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { vocabApi } from '../../api/vocabApi'
import MainLayout from '../../layouts/MainLayout'
import type {
  Band,
  Topic,
  VocabularyExampleRequest,
  VocabularyItem,
  VocabularyRequest,
} from '../../types/vocabulary'

type VocabularyFormState = VocabularyRequest

const emptyVocabularyForm = (): VocabularyFormState => ({
  word: '',
  meaning: '',
  partOfSpeech: '',
  pronunciation: '',
  bandId: 0,
  topicId: 0,
  examples: [{ englishText: '', vietnameseMeaning: '', displayOrder: 1 }],
})

function SectionHeader({
  label,
  title,
}: {
  label: string
  title: string
}) {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--voc-accent)]/70">
          {label}
        </p>
        <h2
          className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {title}
        </h2>
      </div>
      <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
        <BookMarked size={18} />
      </div>
    </div>
  )
}

function ExampleEditor({
  examples,
  onChange,
}: {
  examples: VocabularyExampleRequest[]
  onChange: (value: VocabularyExampleRequest[]) => void
}) {
  const updateExample = (index: number, patch: Partial<VocabularyExampleRequest>) => {
    onChange(
      examples.map((example, currentIndex) =>
        currentIndex === index ? { ...example, ...patch } : example
      )
    )
  }

  return (
    <div className="space-y-3">
      {examples.map((example, index) => (
        <div key={`${index}-${example.displayOrder}`} className="rounded-2xl border border-[var(--voc-border)] bg-[var(--voc-panel-muted)] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--voc-accent)]/70">
            Example {index + 1}
          </p>
          <div className="grid gap-3">
            <textarea
              value={example.englishText}
              onChange={(event) => updateExample(index, { englishText: event.target.value })}
              rows={2}
              placeholder="English example sentence"
              className="rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3 text-sm outline-none transition-all focus:border-[var(--voc-accent)] focus:ring-4 focus:ring-[var(--voc-accent)]/10"
            />
            <textarea
              value={example.vietnameseMeaning}
              onChange={(event) => updateExample(index, { vietnameseMeaning: event.target.value })}
              rows={2}
              placeholder="Vietnamese meaning"
              className="rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3 text-sm outline-none transition-all focus:border-[var(--voc-accent)] focus:ring-4 focus:ring-[var(--voc-accent)]/10"
            />
          </div>
        </div>
      ))}
    </div>
  )
}

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

function BandProgressPanel({ bands }: { bands: Band[] }) {
  const maxCount = Math.max(...bands.map((band) => band.vocabularyCount), 1)

  return (
    <div className="rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] sm:p-7">
      <SectionHeader label="Band Progress" title="How your words are distributed" />

      <div className="space-y-4">
        {bands.map((band) => {
          const width = `${Math.max((band.vocabularyCount / maxCount) * 100, band.vocabularyCount > 0 ? 10 : 0)}%`

          return (
            <div key={band.id} className="rounded-[24px] bg-[var(--voc-panel-muted)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[var(--voc-text)]">{band.name}</p>
                  <p className="mt-1 text-sm text-[var(--voc-text-soft)]">
                    {band.description || 'Vocabulary grouped by IELTS level'}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--voc-accent-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--voc-accent)]">
                  {band.vocabularyCount}
                </span>
              </div>

              <div className="mt-4 h-3 overflow-hidden rounded-full bg-[var(--voc-surface-strong)]">
                <div
                  className="h-full rounded-full bg-[linear-gradient(135deg,var(--voc-accent-strong)_0%,var(--voc-accent)_42%,var(--voc-accent-bright)_100%)]"
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

export default function VocabularyPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const [page, setPage] = useState(1)
  const [selectedBandId, setSelectedBandId] = useState<number | ''>('')
  const [selectedTopicId, setSelectedTopicId] = useState<number | ''>('')

  const [vocabularyItems, setVocabularyItems] = useState<VocabularyItem[]>([])
  const [bands, setBands] = useState<Band[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [editingVocabularyId, setEditingVocabularyId] = useState<number | null>(null)
  const [vocabularyForm, setVocabularyForm] = useState<VocabularyFormState>(emptyVocabularyForm())

  const canSubmitVocabulary = useMemo(
    () =>
      Boolean(
        vocabularyForm.word.trim() &&
          vocabularyForm.meaning.trim() &&
          vocabularyForm.bandId > 0 &&
          vocabularyForm.topicId > 0
      ),
    [vocabularyForm]
  )

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const loadReferenceData = async () => {
    const [bandsResponse, topicsResponse] = await Promise.all([
      vocabApi.getBands('', 1, 100),
      vocabApi.getTopics('', 1, 100),
    ])

    setBands(bandsResponse.items)
    setTopics(topicsResponse.items)

    if (vocabularyForm.bandId === 0 && bandsResponse.items[0]) {
      setVocabularyForm((current) => ({ ...current, bandId: bandsResponse.items[0].id }))
    }

    if (vocabularyForm.topicId === 0 && topicsResponse.items[0]) {
      setVocabularyForm((current) => ({ ...current, topicId: topicsResponse.items[0].id }))
    }
  }

  const loadVocabulary = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await vocabApi.getVocabulary({
        search: deferredSearch,
        page,
        pageSize: 8,
        bandId: selectedBandId === '' ? undefined : selectedBandId,
        topicId: selectedTopicId === '' ? undefined : selectedTopicId,
      })

      setVocabularyItems(response.items)
      setTotalPages(response.totalPages || 1)
      setTotalItems(response.totalItems)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load vocabulary.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void (async () => {
      try {
        await loadReferenceData()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load supporting data.'
        setError(message)
      }
    })()
  }, [])

  useEffect(() => {
    void loadVocabulary()
  }, [deferredSearch, page, selectedBandId, selectedTopicId])

  const resetVocabularyForm = () => {
    setEditingVocabularyId(null)
    setVocabularyForm({
      ...emptyVocabularyForm(),
      bandId: bands[0]?.id ?? 0,
      topicId: topics[0]?.id ?? 0,
    })
  }

  const startEditVocabulary = async (item: VocabularyItem) => {
    try {
      const detail = await vocabApi.getVocabularyById(item.id)
      setEditingVocabularyId(detail.id)
      setVocabularyForm({
        word: detail.word,
        meaning: detail.meaning,
        partOfSpeech: detail.partOfSpeech,
        pronunciation: detail.pronunciation,
        bandId: detail.bandId,
        topicId: detail.topicId,
        examples:
          detail.examples.length > 0
            ? detail.examples.map((example) => ({
                englishText: example.englishText,
                vietnameseMeaning: example.vietnameseMeaning,
                displayOrder: example.displayOrder,
              }))
            : [{ englishText: '', vietnameseMeaning: '', displayOrder: 1 }],
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load vocabulary detail.'
      setError(message)
    }
  }

  const submitVocabulary = async () => {
    if (!canSubmitVocabulary) {
      setError('Please complete word, meaning, band, and topic.')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      if (editingVocabularyId) {
        await vocabApi.updateVocabulary(editingVocabularyId, vocabularyForm)
      } else {
        await vocabApi.createVocabulary(vocabularyForm)
      }

      resetVocabularyForm()
      await loadReferenceData()
      await loadVocabulary()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save vocabulary.'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const deleteVocabulary = async (id: number) => {
    try {
      await vocabApi.deleteVocabulary(id)
      if (editingVocabularyId === id) {
        resetVocabularyForm()
      }
      await loadReferenceData()
      await loadVocabulary()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete vocabulary.'
      setError(message)
    }
  }

  const hero = (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[30px] bg-[linear-gradient(135deg,var(--voc-accent-strong)_0%,var(--voc-accent)_45%,var(--voc-accent-bright)_100%)] p-6 text-white shadow-[0_28px_54px_rgba(134,16,39,0.24)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/74">
          Words
        </p>
        <h2
          className="mt-4 text-[32px] font-black leading-tight tracking-[-0.05em]"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Add, search, and manage vocabulary in one focused page.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">
          This section is dedicated to your word library. Use it to build vocabulary, filter by
          band or topic, and open detail pages for deeper review.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        {[
          ['Words', totalItems.toString()],
          ['Bands', bands.length.toString()],
          ['Topics', topics.length.toString()],
        ].map(([label, value]) => (
          <div key={label} className="rounded-[28px] border border-[var(--voc-border)] bg-[var(--voc-panel)] px-5 py-5 shadow-[0_14px_40px_var(--voc-shadow-soft)]">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--voc-text-soft)]">{label}</p>
            <p
              className="mt-3 text-3xl font-black text-[var(--voc-text)]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <MainLayout
      eyebrow="Words"
      title="A dedicated page for vocabulary management."
      description="Words now live in their own workspace, while bands and topics are managed on separate pages for a cleaner structure."
      hero={hero}
      actionSlot={
        <button
          type="button"
          onClick={resetVocabularyForm}
          className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)]"
        >
          <BookMarked size={15} />
          New word
        </button>
      }
    >
      {error && (
        <div className="mb-6 rounded-3xl border border-[var(--voc-border)] bg-[var(--voc-accent-soft)] px-5 py-4 text-sm text-[var(--voc-accent)]">
          {error}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] sm:p-7">
          <SectionHeader label="Vocabulary Library" title="Search and review your words" />

          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <div className="flex items-center rounded-2xl border border-[var(--voc-border)] bg-white px-4">
              <Search size={16} className="text-[var(--voc-text-soft)]" />
              <input
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Search word or meaning"
                className="w-full bg-transparent px-3 py-4 text-sm outline-none"
              />
            </div>

            <select
              value={selectedBandId}
              onChange={(event) => {
                const value = event.target.value
                setSelectedBandId(value ? Number(value) : '')
                setPage(1)
              }}
              className="rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-4 text-sm outline-none"
            >
              <option value="">All bands</option>
              {bands.map((band) => (
                <option key={band.id} value={band.id}>
                  {band.name}
                </option>
              ))}
            </select>

            <select
              value={selectedTopicId}
              onChange={(event) => {
                const value = event.target.value
                setSelectedTopicId(value ? Number(value) : '')
                setPage(1)
              }}
              className="rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-4 text-sm outline-none"
            >
              <option value="">All topics</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-6 space-y-4">
            {isLoading ? (
              <div className="rounded-3xl border border-dashed border-[var(--voc-border)] bg-[var(--voc-panel-muted)] px-5 py-16 text-center text-sm text-[var(--voc-text-soft)]">
                Loading vocabulary library...
              </div>
            ) : vocabularyItems.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--voc-border)] bg-[var(--voc-panel-muted)] px-5 py-16 text-center text-sm text-[var(--voc-text-soft)]">
                No vocabulary found for the current search and filters.
              </div>
            ) : (
              vocabularyItems.map((item) => (
                <div key={item.id} className="rounded-[28px] border border-[var(--voc-border)] bg-[var(--voc-panel-muted)] p-5 shadow-[0_10px_26px_var(--voc-shadow-soft)]">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className="text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
                          style={{ fontFamily: "'Montserrat', sans-serif" }}
                        >
                          {item.word}
                        </h3>
                        <span className="rounded-full bg-[var(--voc-accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--voc-accent)]">
                          {item.partOfSpeech || 'Vocabulary'}
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-[var(--voc-text-soft)]">
                        {item.pronunciation || 'No pronunciation yet'}
                      </p>
                      <p className="mt-4 text-sm leading-7 text-[var(--voc-text)]">{item.meaning}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <span className="rounded-full border border-[var(--voc-border)] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--voc-text)]">
                          {item.bandName}
                        </span>
                        <span className="rounded-full border border-[var(--voc-border)] bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--voc-text)]">
                          {item.topicName}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => pronounceWord(item.word)}
                        className="rounded-2xl border border-[var(--voc-border)] bg-white p-3 text-[var(--voc-text)] transition-colors hover:bg-[var(--voc-accent-soft)] hover:text-[var(--voc-accent)]"
                      >
                        <Volume2 size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate(`/vocabulary/${item.id}`)}
                        className="rounded-2xl border border-[var(--voc-border)] bg-white p-3 text-[var(--voc-text)] transition-colors hover:bg-[var(--voc-accent-soft)] hover:text-[var(--voc-accent)]"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void startEditVocabulary(item)
                        }}
                        className="rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--voc-text)] transition-colors hover:bg-[var(--voc-accent-soft)] hover:text-[var(--voc-accent)]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void deleteVocabulary(item.id)
                        }}
                        className="rounded-2xl border border-[var(--voc-border)] bg-white p-3 text-[var(--voc-text)] transition-colors hover:bg-[var(--voc-accent-soft)] hover:text-[var(--voc-accent)]"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-[var(--voc-text-soft)]">
              Showing page {page} of {Math.max(totalPages, 1)}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(current - 1, 1))}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--voc-text)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                <ChevronLeft size={15} />
                Prev
              </button>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--voc-text)] disabled:cursor-not-allowed disabled:opacity-45"
              >
                Next
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <BandProgressPanel bands={bands} />

          <div className="rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] sm:p-7">
            <SectionHeader
              label={editingVocabularyId ? 'Edit Word' : 'New Word'}
              title={editingVocabularyId ? 'Update vocabulary entry' : 'Create vocabulary entry'}
            />

            <div className="space-y-3">
              {[
                { key: 'word', label: 'Word', placeholder: 'e.g. compelling' },
                { key: 'meaning', label: 'Meaning', placeholder: 'Vietnamese meaning or explanation' },
                { key: 'partOfSpeech', label: 'Part of speech', placeholder: 'noun / verb / adjective' },
                { key: 'pronunciation', label: 'Pronunciation', placeholder: '/kəmˈpel.ɪŋ/' },
              ].map((field) => (
                <div key={field.key}>
                  <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--voc-text-soft)]">
                    {field.label}
                  </label>
                  <input
                    value={vocabularyForm[field.key as keyof VocabularyFormState] as string}
                    onChange={(event) =>
                      setVocabularyForm((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    className="w-full rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3.5 text-sm outline-none transition-all focus:border-[var(--voc-accent)] focus:ring-4 focus:ring-[var(--voc-accent)]/10"
                  />
                </div>
              ))}

              <div className="grid gap-3 sm:grid-cols-2">
                <select
                  value={vocabularyForm.bandId}
                  onChange={(event) =>
                    setVocabularyForm((current) => ({
                      ...current,
                      bandId: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3.5 text-sm outline-none transition-all focus:border-[var(--voc-accent)] focus:ring-4 focus:ring-[var(--voc-accent)]/10"
                >
                  {bands.map((band) => (
                    <option key={band.id} value={band.id}>
                      {band.name}
                    </option>
                  ))}
                </select>

                <select
                  value={vocabularyForm.topicId}
                  onChange={(event) =>
                    setVocabularyForm((current) => ({
                      ...current,
                      topicId: Number(event.target.value),
                    }))
                  }
                  className="w-full rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3.5 text-sm outline-none transition-all focus:border-[var(--voc-accent)] focus:ring-4 focus:ring-[var(--voc-accent)]/10"
                >
                  {topics.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {topic.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-2">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--voc-text-soft)]">
                  Example sentences
                </p>
                <ExampleEditor
                  examples={vocabularyForm.examples}
                  onChange={(examples) => setVocabularyForm((current) => ({ ...current, examples }))}
                />
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  type="button"
                  disabled={!canSubmitVocabulary || isSaving}
                  onClick={() => {
                    void submitVocabulary()
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-5 py-3.5 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={15} />
                  {isSaving ? 'Saving...' : editingVocabularyId ? 'Update word' : 'Create word'}
                </button>
                <button
                  type="button"
                  onClick={resetVocabularyForm}
                  className="rounded-2xl border border-[var(--voc-border)] bg-white px-5 py-3.5 text-sm font-semibold text-[var(--voc-text)]"
                >
                  Reset form
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
