import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  BookMarked,
  ChevronDown,
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
  VocabularyAiSuggestion,
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

function normalizeMeaningCandidate(value: string, sourceWord: string) {
  const trimmed = value.trim()
  if (!trimmed) {
    return ''
  }

  return trimmed.localeCompare(sourceWord.trim(), undefined, { sensitivity: 'accent' }) === 0
    ? ''
    : trimmed
}

function resolveMeaningSuggestion(suggestion: VocabularyAiSuggestion, fallbackWord: string) {
  const preferredCandidates = [
    suggestion.meaning,
    ...suggestion.meaningCandidates,
  ]

  for (const candidate of preferredCandidates) {
    const normalized = normalizeMeaningCandidate(candidate, fallbackWord)
    if (normalized) {
      return normalized
    }
  }

  return ''
}

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
  onAddExample,
}: {
  examples: VocabularyExampleRequest[]
  onChange: (value: VocabularyExampleRequest[]) => void
  onAddExample?: () => void
  onRemoveExample?: (index: number) => void
}) {
  const updateExample = (index: number, patch: Partial<VocabularyExampleRequest>) => {
    onChange(
      examples.map((example, currentIndex) =>
        currentIndex === index ? { ...example, ...patch } : example
      )
    )
  }

  const removeExample = (index: number) => {
    onChange(examples.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-3">
      {examples.map((example, index) => (
        <div key={`${index}-${example.displayOrder}`} className="rounded-2xl border border-[var(--voc-border)] bg-[var(--voc-panel-muted)] p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--voc-accent)]/70">
              Example {index + 1}
            </p>
            {examples.length > 1 && (
              <button
                type="button"
                onClick={() => removeExample(index)}
                className="text-xs text-red-500 hover:text-red-700"
              >
                Remove
              </button>
            )}
          </div>
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
      {onAddExample && (
        <button
          type="button"
          onClick={onAddExample}
          className="rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--voc-text)] transition-colors hover:bg-[var(--voc-accent-soft)] hover:text-[var(--voc-accent)]"
        >
          + Example
        </button>
      )}
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

interface SelectOrInputProps {
  label: string
  value: string
  onChange: (value: string, id: number) => void
  options: { id: number; name: string }[]
  placeholder: string
}

function SelectOrInput({ label, value, onChange, options, placeholder }: SelectOrInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredOptions = options.filter((option) =>
    option.name.toLowerCase().includes(value.toLowerCase())
  )

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    const matchedOption = options.find((opt) => opt.name.toLowerCase() === val.trim().toLowerCase())
    onChange(val, matchedOption ? matchedOption.id : 0)
    setIsOpen(true)
  }

  const handleSelectOption = (option: { id: number; name: string }) => {
    onChange(option.name, option.id)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--voc-text-soft)]">
        {label}
      </label>
      <div className="relative">
        <input
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-2xl border border-[var(--voc-border)] bg-white pl-4 pr-10 py-3.5 text-sm outline-none transition-all focus:border-[var(--voc-accent)] focus:ring-4 focus:ring-[var(--voc-accent)]/10"
        />
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--voc-text-soft)] hover:text-[var(--voc-text)]"
        >
          <ChevronDown size={16} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {isOpen && (
        <div className="absolute z-50 mt-2 max-h-60 w-full overflow-y-auto rounded-2xl border border-[var(--voc-border)] bg-white p-2 shadow-lg">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelectOption(option)}
                className="w-full rounded-xl px-4 py-2.5 text-left text-sm text-[var(--voc-text)] transition-colors hover:bg-[var(--voc-accent-soft)] hover:text-[var(--voc-accent)]"
              >
                {option.name}
              </button>
            ))
          ) : (
            <div className="px-4 py-2.5 text-sm text-[var(--voc-text-soft)] italic">
              {value.trim() ? `New: "${value}" (will be created)` : 'No options available'}
            </div>
          )}
        </div>
      )}
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
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSuggestion, setLastSuggestion] = useState<VocabularyAiSuggestion | null>(null)

  const [editingVocabularyId, setEditingVocabularyId] = useState<number | null>(null)
  const [vocabularyForm, setVocabularyForm] = useState<VocabularyFormState>(emptyVocabularyForm())
  const [bandInput, setBandInput] = useState('')
  const [topicInput, setTopicInput] = useState('')
  const [showCategory, setShowCategory] = useState(false)
  const [activeCategory, setActiveCategory] = useState<'band' | 'topic'>('band')
  const categoryRef = useRef<HTMLDivElement | null>(null)
  const [filterBandIds, setFilterBandIds] = useState<number[]>([])
  const [filterTopicIds, setFilterTopicIds] = useState<number[]>([])
  const [filterPos, setFilterPos] = useState<string[]>([])
  const [searchParams] = useSearchParams()

  const canSubmitVocabulary = useMemo(
    () =>
      Boolean(
        vocabularyForm.word.trim() &&
          vocabularyForm.meaning.trim() &&
          (vocabularyForm.bandId > 0 || bandInput.trim()) &&
          (vocabularyForm.topicId > 0 || topicInput.trim())
      ),
    [vocabularyForm, bandInput, topicInput]
  )

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategory(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const loadReferenceData = async () => {
    const [bandsResponse, topicsResponse] = await Promise.all([
      vocabApi.getBands('', 1, 100),
      vocabApi.getTopics('', 1, 100),
    ])

    setBands(bandsResponse.items)
    setTopics(topicsResponse.items)
    // set defaults for input placeholders
    if (!bandInput && bandsResponse.items[0]) {
      setBandInput(bandsResponse.items[0].name)
      setVocabularyForm((current) => ({ ...current, bandId: bandsResponse.items[0].id }))
    }

    if (!topicInput && topicsResponse.items[0]) {
      setTopicInput(topicsResponse.items[0].name)
      setVocabularyForm((current) => ({ ...current, topicId: topicsResponse.items[0].id }))
    }
  }

  const loadVocabulary = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const query: any = {
        search: deferredSearch,
        page,
        pageSize: 8,
      }

      // if only one filter selected, pass it to server to reduce result set
      if (filterBandIds.length > 0) query.bands = filterBandIds.join(',')
      else if (selectedBandId !== '') query.bandId = selectedBandId

      if (filterTopicIds.length > 0) query.topics = filterTopicIds.join(',')
      else if (selectedTopicId !== '') query.topicId = selectedTopicId

      if (filterPos.length > 0) query.pos = filterPos.join(',')

      const response = await vocabApi.getVocabulary(query)
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
      // parse multi-filter params from URL
      const bandsParam = searchParams.get('bands')
      const topicsParam = searchParams.get('topics')
      const posParam = searchParams.get('pos')
      const searchParam = searchParams.get('search')

      if (bandsParam) setFilterBandIds(bandsParam.split(',').map((s) => Number(s)).filter(Number.isFinite))
      if (topicsParam) setFilterTopicIds(topicsParam.split(',').map((s) => Number(s)).filter(Number.isFinite))
      if (posParam) setFilterPos(posParam.split(',').map((s) => s.trim()).filter(Boolean))
      if (searchParam) setSearch(searchParam)
    })()
  }, [])

  useEffect(() => {
    void loadVocabulary()
  }, [deferredSearch, page, selectedBandId, selectedTopicId, filterBandIds, filterTopicIds, filterPos])

  const resetVocabularyForm = () => {
    setEditingVocabularyId(null)
    setLastSuggestion(null)
    const defaultBand = bands[0]
    const defaultTopic = topics[0]
    setBandInput(defaultBand ? defaultBand.name : '')
    setTopicInput(defaultTopic ? defaultTopic.name : '')
    setVocabularyForm({
      ...emptyVocabularyForm(),
      bandId: defaultBand?.id ?? 0,
      topicId: defaultTopic?.id ?? 0,
    })
  }

  const addExample = () => {
    setVocabularyForm((current) => ({
      ...current,
      examples: [
        ...current.examples,
        { englishText: '', vietnameseMeaning: '', displayOrder: current.examples.length + 1 },
      ],
    }))
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
      setBandInput(detail.bandName || '')
      setTopicInput(detail.topicName || '')
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
      let finalBandId = vocabularyForm.bandId
      let finalTopicId = vocabularyForm.topicId

      // Resolve or create band if needed
      if (finalBandId === 0 && bandInput.trim()) {
        const input = bandInput.trim()
        const parsed = parseFloat(input)
        const isNumber = !Number.isNaN(parsed) && /^\d+(?:\.\d+)?$/.test(input)
        const lookupName = isNumber ? `IELTS ${input}` : input

        const matchedBand = bands.find((b) => {
          const name = b.name.toLowerCase()
          return (
            name === input.toLowerCase() ||
            name === lookupName.toLowerCase() ||
            (isNumber && name.includes(String(parsed)))
          )
        })

        if (matchedBand) {
          finalBandId = matchedBand.id
        } else {
          const createName = lookupName
          const newBand = await vocabApi.createBand({
            name: createName,
            description: `IELTS Band ${isNumber ? input : createName}`,
            sortOrder: isNumber ? parsed : 1,
          })
          setBands((current) => [newBand, ...current])
          finalBandId = newBand.id
          setBandInput(newBand.name)
        }
      }

      // Resolve or create topic if needed
      if (finalTopicId === 0 && topicInput.trim()) {
        const matchedTopic = topics.find(
          (t) => t.name.toLowerCase() === topicInput.trim().toLowerCase()
        )
        if (matchedTopic) {
          finalTopicId = matchedTopic.id
        } else {
          const newTopic = await vocabApi.createTopic({
            name: topicInput.trim(),
            description: `Topic: ${topicInput.trim()}`,
            colorHex: '#C51E3A',
          })
          setTopics((current) => [newTopic, ...current])
          finalTopicId = newTopic.id
          setTopicInput(newTopic.name)
        }
      }

      const updatedForm = {
        ...vocabularyForm,
        bandId: finalBandId,
        topicId: finalTopicId,
      }

      let createdLinkedWords = 0

      if (editingVocabularyId) {
        await vocabApi.updateVocabulary(editingVocabularyId, updatedForm)
      } else {
        await vocabApi.createVocabulary(updatedForm)
        createdLinkedWords = await createLinkedVocabularyEntries(updatedForm, lastSuggestion)
      }

      resetVocabularyForm()
      await loadReferenceData()
      await loadVocabulary()

      if (createdLinkedWords > 0) {
        setError(null)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save vocabulary.'
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const autofillVocabulary = async () => {
    if (!vocabularyForm.word.trim()) {
      setError('Please enter a word before using AI auto-fill.')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      const suggestion = await vocabApi.suggestVocabulary({ word: vocabularyForm.word.trim() })
      const resolvedMeaning = resolveMeaningSuggestion(suggestion, suggestion.word || currentWordValue(vocabularyForm.word))
      setLastSuggestion(suggestion)

      // Determine band
      let selectedBandId = vocabularyForm.bandId || 0
      let selectedBandName = bandInput || ''

      if (suggestion.bandLevel) {
        const bandName = `IELTS ${suggestion.bandLevel}`
        const foundBand = bands.find((b) => b.name.toLowerCase() === bandName.toLowerCase())
        if (foundBand) {
          selectedBandId = foundBand.id
          selectedBandName = foundBand.name
        } else {
          try {
            const newBand = await vocabApi.createBand({ name: bandName, description: `IELTS Band ${suggestion.bandLevel}`, sortOrder: suggestion.bandLevel })
            setBands((current) => [newBand, ...current])
            selectedBandId = newBand.id
            selectedBandName = newBand.name
          } catch {
            // ignore
          }
        }
      } else {
        const lower = (suggestion.meaning + ' ' + suggestion.providerSummary).toLowerCase()
        const foundBand = bands.find((b) => lower.includes(b.name.toLowerCase()))
        if (foundBand) {
          selectedBandId = foundBand.id
          selectedBandName = foundBand.name
        }
      }

      // Determine topic
      let selectedTopicId = vocabularyForm.topicId || 0
      let selectedTopicName = topicInput || ''

      if (suggestion.topicName) {
        const foundTopic = topics.find((t) => t.name.toLowerCase() === suggestion.topicName!.toLowerCase())
        if (foundTopic) {
          selectedTopicId = foundTopic.id
          selectedTopicName = foundTopic.name
        } else {
          try {
            const newTopic = await vocabApi.createTopic({ name: suggestion.topicName, description: `Topic: ${suggestion.topicName}`, colorHex: '#C51E3A' })
            setTopics((current) => [newTopic, ...current])
            selectedTopicId = newTopic.id
            selectedTopicName = newTopic.name
          } catch {
            // ignore
          }
        }
      } else {
        const lower = (suggestion.meaning + ' ' + suggestion.providerSummary).toLowerCase()
        const foundTopic = topics.find((t) => lower.includes(t.name.toLowerCase()))
        if (foundTopic) {
          selectedTopicId = foundTopic.id
          selectedTopicName = foundTopic.name
        }
      }

      setBandInput(selectedBandName)
      setTopicInput(selectedTopicName)

      setVocabularyForm((current) => ({
        ...current,
        word: suggestion.word || current.word,
        meaning: resolvedMeaning || current.meaning,
        partOfSpeech: suggestion.partOfSpeech,
        pronunciation: suggestion.pronunciation,
        bandId: selectedBandId,
        topicId: selectedTopicId,
        examples:
          suggestion.examples.length > 0
            ? suggestion.examples.map((example, index) => ({
                englishText: example.englishText,
                vietnameseMeaning: example.vietnameseMeaning,
                displayOrder: index + 1,
              }))
            : current.examples,
      }))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'AI auto-fill is unavailable right now.'
      setError(message)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const createLinkedVocabularyEntries = async (
    baseForm: VocabularyFormState,
    suggestion: VocabularyAiSuggestion | null
  ) => {
    if (!suggestion) {
      return 0
    }

    const seen = new Set<string>([baseForm.word.trim().toLowerCase()])
    const candidates = [
      ...suggestion.relatedForms.map((form) => ({ word: form.word, partOfSpeech: form.partOfSpeech })),
      ...suggestion.synonyms.map((word) => ({ word, partOfSpeech: suggestion.partOfSpeech })),
    ]
      .filter((candidate) => {
        const normalized = candidate.word.trim().toLowerCase()
        if (!normalized || seen.has(normalized)) {
          return false
        }
        seen.add(normalized)
        return true
      })
      .slice(0, 8)

    let createdCount = 0

    for (const candidate of candidates) {
      try {
        const linkedSuggestion = await vocabApi.suggestVocabulary({ word: candidate.word })
        const linkedMeaning = resolveMeaningSuggestion(linkedSuggestion, candidate.word)

        if (!linkedMeaning) {
          continue
        }

        await vocabApi.createVocabulary({
          word: linkedSuggestion.word || candidate.word,
          meaning: linkedMeaning,
          partOfSpeech: candidate.partOfSpeech || linkedSuggestion.partOfSpeech,
          pronunciation: linkedSuggestion.pronunciation,
          bandId: baseForm.bandId,
          topicId: baseForm.topicId,
          examples:
            linkedSuggestion.examples.length > 0
              ? linkedSuggestion.examples.map((example, index) => ({
                  englishText: example.englishText,
                  vietnameseMeaning: example.vietnameseMeaning,
                  displayOrder: index + 1,
                }))
              : [{ englishText: '', vietnameseMeaning: '', displayOrder: 1 }],
        })

        createdCount += 1
      } catch {
        // Skip linked entries that cannot be enriched or already exist.
      }
    }

    return createdCount
  }

  const currentWordValue = (value: string) => value.trim()

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
          Do what you want with your words.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">
          This is your word library. Build vocabulary, filter by
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
      title="Vocabulary management."
      description="All your words."
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

          <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
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
              <button
                type="button"
                onClick={() => navigate('/vocabulary/filter')}
                className="ml-3 rounded-2xl border border-[var(--voc-border)] bg-white px-3 py-2 text-sm font-semibold"
              >
                Advanced filters
              </button>
            </div>

            {/* Category dropdown: contains Band and Topic filters */}
            <div className="relative" ref={categoryRef}>
              <button
                type="button"
                onClick={() => setShowCategory((s) => !s)}
                className="flex items-center gap-2 rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-4 text-sm font-semibold outline-none"
              >
                Category
                <ChevronDown size={16} className={`transition-transform ${showCategory ? 'rotate-180' : ''}`} />
              </button>

              {showCategory && (
                <div className="absolute z-50 mt-2 w-80 max-h-72 overflow-y-auto rounded-2xl border border-[var(--voc-border)] bg-white p-3 shadow-lg">
                  <div className="mb-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveCategory('band')}
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${activeCategory === 'band' ? 'bg-[var(--voc-accent-soft)] text-[var(--voc-accent)]' : 'bg-[var(--voc-panel-muted)] text-[var(--voc-text)]'}`}
                    >
                      Band
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveCategory('topic')}
                      className={`rounded-full px-3 py-1 text-sm font-semibold ${activeCategory === 'topic' ? 'bg-[var(--voc-accent-soft)] text-[var(--voc-accent)]' : 'bg-[var(--voc-panel-muted)] text-[var(--voc-text)]'}`}
                    >
                      Topic
                    </button>
                    <div className="ml-auto text-xs text-[var(--voc-text-soft)]">Sort: {activeCategory === 'band' ? 'Low → High' : 'A → Z'}</div>
                  </div>

                  <div>
                    {activeCategory === 'band' ? (
                      <div className="grid gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            // sort bands by sortOrder ascending then name
                            const sorted = [...bands].sort((a, b) => {
                              const sa = Number.isFinite(a.sortOrder) ? a.sortOrder : 0
                              const sb = Number.isFinite(b.sortOrder) ? b.sortOrder : 0
                              if (sa !== sb) return sa - sb
                              return a.name.localeCompare(b.name)
                            })
                            setBands(sorted)
                          }}
                          className="mb-2 w-full rounded-xl border border-[var(--voc-border)] bg-[var(--voc-panel-muted)] px-3 py-2 text-left text-sm font-medium text-[var(--voc-text)]"
                        >
                          Sort bands (Low → High)
                        </button>
                        <div className="max-h-44 overflow-y-auto">
                          {bands.map((band) => (
                            <button
                              key={band.id}
                              type="button"
                              onClick={() => {
                                setSelectedBandId(band.id)
                                setPage(1)
                                setShowCategory(false)
                              }}
                              className="w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--voc-text)] hover:bg-[var(--voc-accent-soft)] hover:text-[var(--voc-accent)]"
                            >
                              {band.name}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedBandId('')
                            setPage(1)
                            setShowCategory(false)
                          }}
                          className="mt-2 w-full rounded-xl border border-[var(--voc-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--voc-text)]"
                        >
                          Clear band filter
                        </button>
                      </div>
                    ) : (
                      <div className="grid gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const sorted = [...topics].sort((a, b) => a.name.localeCompare(b.name))
                            setTopics(sorted)
                          }}
                          className="mb-2 w-full rounded-xl border border-[var(--voc-border)] bg-[var(--voc-panel-muted)] px-3 py-2 text-left text-sm font-medium text-[var(--voc-text)]"
                        >
                          Sort topics (A → Z)
                        </button>
                        <div className="max-h-44 overflow-y-auto">
                          {topics.map((topic) => (
                            <button
                              key={topic.id}
                              type="button"
                              onClick={() => {
                                setSelectedTopicId(topic.id)
                                setPage(1)
                                setShowCategory(false)
                              }}
                              className="w-full rounded-xl px-3 py-2 text-left text-sm text-[var(--voc-text)] hover:bg-[var(--voc-accent-soft)] hover:text-[var(--voc-accent)]"
                            >
                              {topic.name}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTopicId('')
                            setPage(1)
                            setShowCategory(false)
                          }}
                          className="mt-2 w-full rounded-xl border border-[var(--voc-border)] bg-white px-3 py-2 text-sm font-semibold text-[var(--voc-text)]"
                        >
                          Clear topic filter
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
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
              <div className="rounded-[24px] border border-[var(--voc-border)] bg-[var(--voc-panel-muted)] p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--voc-text)]">Auto-fill with AI</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--voc-text-soft)]">
                      Get ready-to-review suggestions for part of speech, pronunciation, meaning, and example sentences as soon as you enter a word.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={!vocabularyForm.word.trim() || isAnalyzing}
                    onClick={() => {
                      void autofillVocabulary()
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--voc-text)] transition-all hover:bg-[var(--voc-accent-soft)] hover:text-[var(--voc-accent)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Bot size={15} />
                    {isAnalyzing ? 'Preparing suggestions...' : 'Auto-fill with AI'}
                  </button>
                </div>
              </div>

              {lastSuggestion && (
                <div className="rounded-[24px] border border-[var(--voc-border)] bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--voc-text)]">
                        Suggestions are ready
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[var(--voc-text-soft)]">
                        Review the suggested details below and adjust anything before saving this word.
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--voc-accent-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--voc-accent)]">
                      {Math.max(lastSuggestion.examples.length, 0)} examples
                    </span>
                  </div>

                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    {/* Cột 1: English definition */}
                    <div className="rounded-2xl bg-[var(--voc-panel-muted)] p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--voc-text-soft)]">
                        English definition
                      </p>
                      <p className="mt-2 text-sm text-[var(--voc-text)]">
                        {lastSuggestion.englishDefinition || 'Definition is being prepared.'}
                      </p>
                    </div>

                    {/* Cột 2: Meaning options (Chỉ hiển thị nếu có phần tử) */}
                    {lastSuggestion.meaningCandidates && lastSuggestion.meaningCandidates.length > 0 ? (
                      <div className="rounded-2xl bg-[var(--voc-panel-muted)] p-3">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--voc-text-soft)]">
                          Meaning options
                        </p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {lastSuggestion.meaningCandidates.map((candidate) => (
                            <span
                              key={candidate}
                              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--voc-text)]"
                            >
                              {candidate}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Ô trống dự phòng nếu không có dữ liệu để giữ nguyên layout 3 cột */
                      <div className="rounded-2xl bg-[var(--voc-panel-muted)] p-3 opacity-50">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--voc-text-soft)]">
                          Meaning options
                        </p>
                        <p className="mt-2 text-xs text-[var(--voc-text-soft)]">No options available.</p>
                      </div>
                    )}

                    {/* Cột 3: Word family */}
                    <div className="rounded-2xl bg-[var(--voc-panel-muted)] p-3">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[var(--voc-text-soft)]">
                        Word family
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {lastSuggestion.relatedForms && lastSuggestion.relatedForms.length > 0 ? (
                          lastSuggestion.relatedForms.map((form) => (
                            <span
                              key={`${form.word}-${form.partOfSpeech}`}
                              className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-[var(--voc-text)]"
                            >
                              {form.word} · {form.partOfSpeech}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-[var(--voc-text-soft)]">
                            No alternate forms were found for this entry yet.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

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
                <SelectOrInput
                  label="Band"
                  value={bandInput}
                  onChange={(name, id) => {
                    setBandInput(name)
                    setVocabularyForm((current) => ({
                      ...current,
                      bandId: id,
                    }))
                  }}
                  options={bands}
                  placeholder="e.g. IELTS 7.0 or custom"
                />

                <SelectOrInput
                  label="Topic"
                  value={topicInput}
                  onChange={(name, id) => {
                    setTopicInput(name)
                    setVocabularyForm((current) => ({
                      ...current,
                      topicId: id,
                    }))
                  }}
                  options={topics}
                  placeholder="e.g. Business or custom"
                />
              </div>

              <div className="pt-2">
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--voc-text-soft)]">
                  Example sentences
                </p>
                <ExampleEditor
                  examples={vocabularyForm.examples}
                  onChange={(examples) => setVocabularyForm((current) => ({ ...current, examples }))}
                  onAddExample={addExample}
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
