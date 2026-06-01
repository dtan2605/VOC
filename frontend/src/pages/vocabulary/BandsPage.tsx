import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit3, GraduationCap, Plus, Save, Trash2 } from 'lucide-react'
import MainLayout from '../../layouts/MainLayout'
import { useAuth } from '../../hooks/useAuth'
import { vocabApi } from '../../api/vocabApi'
import type { Band, BandRequest } from '../../types/vocabulary'

const emptyBandForm = (): BandRequest => ({
  name: '',
  description: '',
  sortOrder: 0,
})

function SectionHeader() {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--voc-accent)]/70">
          Bands
        </p>
        <h2
          className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Manage IELTS levels
        </h2>
      </div>
      <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
        <GraduationCap size={18} />
      </div>
    </div>
  )
}

export default function BandsPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [bands, setBands] = useState<Band[]>([])
  const [bandForm, setBandForm] = useState<BandRequest>(emptyBandForm())
  const [editingBandId, setEditingBandId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const loadBands = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await vocabApi.getBands('', 1, 100)
      setBands(response.items)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load bands.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadBands()
  }, [])

  const submitBand = async () => {
    if (!bandForm.name.trim()) {
      setError('Band name is required.')
      return
    }

    try {
      if (editingBandId) {
        await vocabApi.updateBand(editingBandId, bandForm)
      } else {
        await vocabApi.createBand(bandForm)
      }

      setEditingBandId(null)
      setBandForm(emptyBandForm())
      await loadBands()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save band.'
      setError(message)
    }
  }

  const handleDeleteBand = async (id: number) => {
    try {
      await vocabApi.deleteBand(id)
      await loadBands()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete band.'
      setError(message)
    }
  }

  const hero = (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[30px] bg-[linear-gradient(135deg,var(--voc-accent-strong)_0%,var(--voc-accent)_45%,var(--voc-accent-bright)_100%)] p-6 text-white shadow-[0_28px_54px_rgba(134,16,39,0.24)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/74">
          Vocabulary Organization
        </p>
        <h2
          className="mt-4 text-[32px] font-black leading-tight tracking-[-0.05em]"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Page just for band management.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">
          Use this screen to define study levels like band 4-5, 5-6, or 7-8 so words stay grouped
          by difficulty.
        </p>
      </div>

      <div className="rounded-[28px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-5 shadow-[0_14px_40px_var(--voc-shadow-soft)]">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--voc-text-soft)]">Total bands</p>
        <p
          className="mt-3 text-4xl font-black text-[var(--voc-text)]"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {bands.length}
        </p>
      </div>
    </div>
  )

  return (
    <MainLayout
      eyebrow="Bands"
      title="Separate band management for a cleaner workflow."
      description="Sort your words by difficulty levels with bands."
      hero={hero}
      actionSlot={
        <button
          type="button"
          onClick={() => {
            setEditingBandId(null)
            setBandForm(emptyBandForm())
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)]"
        >
          <Plus size={15} />
          New band
        </button>
      }
    >
      {error && (
        <div className="mb-6 rounded-3xl border border-[var(--voc-border)] bg-[var(--voc-accent-soft)] px-5 py-4 text-sm text-[var(--voc-accent)]">
          {error}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] sm:p-7">
          <SectionHeader />

          <div className="space-y-3">
            <input
              value={bandForm.name}
              onChange={(event) => setBandForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Band name"
              className="w-full rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3.5 text-sm outline-none transition-all focus:border-[var(--voc-accent)] focus:ring-4 focus:ring-[var(--voc-accent)]/10"
            />
            <input
              value={bandForm.description}
              onChange={(event) => setBandForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Band description"
              className="w-full rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3.5 text-sm outline-none transition-all focus:border-[var(--voc-accent)] focus:ring-4 focus:ring-[var(--voc-accent)]/10"
            />
            <input
              value={bandForm.sortOrder}
              type="number"
              onChange={(event) => setBandForm((current) => ({ ...current, sortOrder: Number(event.target.value) }))}
              placeholder="Sort order"
              className="w-full rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3.5 text-sm outline-none transition-all focus:border-[var(--voc-accent)] focus:ring-4 focus:ring-[var(--voc-accent)]/10"
            />

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  void submitBand()
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-5 py-3.5 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)]"
              >
                <Save size={15} />
                {editingBandId ? 'Update band' : 'Create band'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingBandId(null)
                  setBandForm(emptyBandForm())
                }}
                className="rounded-2xl border border-[var(--voc-border)] bg-white px-5 py-3.5 text-sm font-semibold text-[var(--voc-text)]"
              >
                Reset form
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] sm:p-7">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--voc-accent)]/70">
                Current list
              </p>
              <h2
                className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Existing band groups
              </h2>
            </div>
            <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
              <GraduationCap size={18} />
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-3xl border border-dashed border-[var(--voc-border)] bg-[var(--voc-panel-muted)] px-5 py-16 text-center text-sm text-[var(--voc-text-soft)]">
                Loading bands...
              </div>
            ) : bands.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--voc-border)] bg-[var(--voc-panel-muted)] px-5 py-16 text-center text-sm text-[var(--voc-text-soft)]">
                No bands available yet.
              </div>
            ) : (
              bands.map((band) => (
                <div key={band.id} className="rounded-[26px] border border-[var(--voc-border)] bg-[var(--voc-panel-muted)] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[var(--voc-text)]">{band.name}</p>
                      <p className="mt-1 text-sm leading-6 text-[var(--voc-text-soft)]">
                        {band.description || 'No description'}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--voc-accent)]/70">
                        {band.vocabularyCount} words
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBandId(band.id)
                          setBandForm({
                            name: band.name,
                            description: band.description,
                            sortOrder: band.sortOrder,
                          })
                        }}
                        className="rounded-xl p-2 text-[var(--voc-text)] hover:bg-[var(--voc-accent-soft)] hover:text-[var(--voc-accent)]"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleDeleteBand(band.id)
                        }}
                        className="rounded-xl p-2 text-[var(--voc-text)] hover:bg-[var(--voc-accent-soft)] hover:text-[var(--voc-accent)]"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
