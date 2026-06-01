import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../../layouts/MainLayout'
import { vocabApi } from '../../api/vocabApi'
import type { Band, Topic } from '../../types/vocabulary'

export default function FilterPage() {
  const navigate = useNavigate()
  const [bands, setBands] = useState<Band[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [selectedBandIds, setSelectedBandIds] = useState<number[]>([])
  const [selectedTopicIds, setSelectedTopicIds] = useState<number[]>([])
  const [selectedPos, setSelectedPos] = useState<string[]>([])
  const [searchText, setSearchText] = useState('')
  const [previewCount, setPreviewCount] = useState<number | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [bandQuery, setBandQuery] = useState('')
  const [topicQuery, setTopicQuery] = useState('')

  useEffect(() => {
    void (async () => {
      const b = await vocabApi.getBands('', 1, 200)
      const t = await vocabApi.getTopics('', 1, 200)
      setBands(b.items)
      setTopics(t.items)
    })()
  }, [])

  const toggle = (arr: number[], setArr: (v: number[]) => void, id: number) => {
    if (arr.includes(id)) setArr(arr.filter((x) => x !== id))
    else setArr([...arr, id])
  }

  const selectAll = (items: { id: number }[], setArr: (v: number[]) => void) => {
    setArr(items.map((i) => i.id))
  }

  const togglePos = (pos: string) => {
    if (selectedPos.includes(pos)) setSelectedPos(selectedPos.filter((p) => p !== pos))
    else setSelectedPos([...selectedPos, pos])
  }

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (selectedBandIds.length) params.set('bands', selectedBandIds.join(','))
    if (selectedTopicIds.length) params.set('topics', selectedTopicIds.join(','))
    if (selectedPos.length) params.set('pos', selectedPos.join(','))
    if (searchText.trim()) params.set('search', searchText.trim())

    navigate(`/vocabulary?${params.toString()}`)
  }

  const previewResults = async () => {
    setPreviewLoading(true)
    setPreviewCount(null)
    try {
      const query: any = {}
      if (selectedBandIds.length) query.bands = selectedBandIds.join(',')
      if (selectedTopicIds.length) query.topics = selectedTopicIds.join(',')
      if (selectedPos.length) query.pos = selectedPos.join(',')
      if (searchText.trim()) query.search = searchText.trim()

      const response = await vocabApi.getVocabulary({ ...query, page: 1, pageSize: 1 })
      setPreviewCount(response.totalItems)
    } catch (err) {
      setPreviewCount(null)
    } finally {
      setPreviewLoading(false)
    }
  }

  const clearAll = () => {
    setSelectedBandIds([])
    setSelectedTopicIds([])
    setSelectedPos([])
    setSearchText('')
  }

  const posOptions = ['noun', 'verb', 'adjective', 'adverb', 'phrase']

  return (
    <MainLayout eyebrow="Filters" title="Advanced Filters" description="Filter your wrord to learn easier.">
      <div className="rounded-2xl border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--voc-text-soft)]">Search</label>
            <input value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="free text search" className="w-full rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3.5 text-sm" />
          </div>

          <div>
            <label className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--voc-text-soft)]">Part of speech</label>
            <div className="flex flex-wrap gap-2">
              {posOptions.map((p) => (
                <button key={p} type="button" onClick={() => togglePos(p)} className={`rounded-full px-3 py-2 text-sm ${selectedPos.includes(p) ? 'bg-[var(--voc-accent-soft)] text-[var(--voc-accent)]' : 'bg-[var(--voc-panel-muted)] text-[var(--voc-text)]'}`}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <div className="flex items-center justify-between">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--voc-text-soft)]">Bands</p>
              <div className="flex items-center gap-2">
                <input placeholder="Search bands" value={bandQuery} onChange={(e) => setBandQuery(e.target.value)} className="rounded-xl border border-[var(--voc-border)] px-2 py-1 text-sm" />
                <button type="button" onClick={() => selectAll(bands, setSelectedBandIds)} className="text-sm underline">Select all</button>
                <button type="button" onClick={() => setSelectedBandIds([])} className="text-sm underline">Clear</button>
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto rounded-xl border border-[var(--voc-border)] bg-white p-2">
              {bands.filter((b) => b.name.toLowerCase().includes(bandQuery.toLowerCase())).map((b) => (
                <label key={b.id} className="flex items-center gap-2 px-2 py-1">
                  <input type="checkbox" checked={selectedBandIds.includes(b.id)} onChange={() => toggle(selectedBandIds, setSelectedBandIds, b.id)} />
                  <span className="text-sm">{b.name}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--voc-text-soft)]">Topics</p>
              <div className="flex items-center gap-2">
                <input placeholder="Search topics" value={topicQuery} onChange={(e) => setTopicQuery(e.target.value)} className="rounded-xl border border-[var(--voc-border)] px-2 py-1 text-sm" />
                <button type="button" onClick={() => selectAll(topics, setSelectedTopicIds)} className="text-sm underline">Select all</button>
                <button type="button" onClick={() => setSelectedTopicIds([])} className="text-sm underline">Clear</button>
              </div>
            </div>
            <div className="max-h-56 overflow-y-auto rounded-xl border border-[var(--voc-border)] bg-white p-2">
              {topics.filter((t) => t.name.toLowerCase().includes(topicQuery.toLowerCase())).map((t) => (
                <label key={t.id} className="flex items-center gap-2 px-2 py-1">
                  <input type="checkbox" checked={selectedTopicIds.includes(t.id)} onChange={() => toggle(selectedTopicIds, setSelectedTopicIds, t.id)} />
                  <span className="text-sm">{t.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3">
          <button type="button" onClick={applyFilters} className="rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-4 py-2 text-white font-semibold">Apply filters</button>
          <button type="button" onClick={previewResults} className="rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-2 font-semibold">{previewLoading ? 'Checking...' : 'Preview results'}</button>
          <button type="button" onClick={clearAll} className="rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-2 font-semibold">Clear</button>
          <button type="button" onClick={() => navigate('/vocabulary')} className="rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-2 font-semibold">Back</button>
          {previewCount !== null && (
            <div className="ml-auto rounded-full bg-[var(--voc-panel-muted)] px-3 py-2 text-sm font-semibold">{previewCount.toLocaleString()} results</div>
          )}
        </div>

        <div className="mt-4">
          <p className="text-[11px] text-[var(--voc-text-soft)]">Active filters:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {selectedBandIds.map((id) => (
              <button key={`b-${id}`} type="button" onClick={() => setSelectedBandIds(selectedBandIds.filter((x) => x !== id))} className="rounded-full bg-white px-3 py-1 text-sm flex items-center gap-2">
                <span>Band: {bands.find((b) => b.id === id)?.name || id}</span>
                <span className="text-[12px]">✕</span>
              </button>
            ))}
            {selectedTopicIds.map((id) => (
              <button key={`t-${id}`} type="button" onClick={() => setSelectedTopicIds(selectedTopicIds.filter((x) => x !== id))} className="rounded-full bg-white px-3 py-1 text-sm flex items-center gap-2">
                <span>Topic: {topics.find((t) => t.id === id)?.name || id}</span>
                <span className="text-[12px]">✕</span>
              </button>
            ))}
            {selectedPos.map((p) => (
              <button key={`p-${p}`} type="button" onClick={() => setSelectedPos(selectedPos.filter((x) => x !== p))} className="rounded-full bg-white px-3 py-1 text-sm flex items-center gap-2">
                <span>POS: {p}</span>
                <span className="text-[12px]">✕</span>
              </button>
            ))}
            {searchText && (
              <button type="button" onClick={() => setSearchText('')} className="rounded-full bg-white px-3 py-1 text-sm flex items-center gap-2">
                <span>Search: {searchText}</span>
                <span className="text-[12px]">✕</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
