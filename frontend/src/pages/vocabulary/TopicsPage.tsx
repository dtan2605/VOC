import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Edit3, Layers3, Plus, Save, Trash2 } from 'lucide-react'
import MainLayout from '../../layouts/MainLayout'
import { useAuth } from '../../hooks/useAuth'
import { vocabApi } from '../../api/vocabApi'
import type { Topic, TopicRequest } from '../../types/vocabulary'

const emptyTopicForm = (): TopicRequest => ({
  name: '',
  description: '',
  colorHex: '#C51E3A',
})

function SectionHeader() {
  return (
    <div className="mb-5 flex items-center justify-between gap-4">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--voc-accent)]/70">
          Topics
        </p>
        <h2
          className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          Manage learning themes
        </h2>
      </div>
      <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
        <Layers3 size={18} />
      </div>
    </div>
  )
}

export default function TopicsPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [topics, setTopics] = useState<Topic[]>([])
  const [topicForm, setTopicForm] = useState<TopicRequest>(emptyTopicForm())
  const [editingTopicId, setEditingTopicId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const loadTopics = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await vocabApi.getTopics('', 1, 100)
      setTopics(response.items)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load topics.'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadTopics()
  }, [])

  const submitTopic = async () => {
    if (!topicForm.name.trim()) {
      setError('Topic name is required.')
      return
    }

    try {
      if (editingTopicId) {
        await vocabApi.updateTopic(editingTopicId, topicForm)
      } else {
        await vocabApi.createTopic(topicForm)
      }

      setEditingTopicId(null)
      setTopicForm(emptyTopicForm())
      await loadTopics()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save topic.'
      setError(message)
    }
  }

  const handleDeleteTopic = async (id: number) => {
    try {
      await vocabApi.deleteTopic(id)
      await loadTopics()
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete topic.'
      setError(message)
    }
  }

  const hero = (
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-[30px] bg-[linear-gradient(135deg,var(--voc-accent-strong)_0%,var(--voc-accent)_45%,var(--voc-accent-bright)_100%)] p-6 text-white shadow-[0_28px_54px_rgba(134,16,39,0.24)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/74">
          Topic Organization
        </p>
        <h2
          className="mt-4 text-[32px] font-black leading-tight tracking-[-0.05em]"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          One page just for topic management.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-white/82">
          Use topics like travel, science, business, or daily life to keep related vocabulary in
          meaningful groups.
        </p>
      </div>

      <div className="rounded-[28px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-5 shadow-[0_14px_40px_var(--voc-shadow-soft)]">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--voc-text-soft)]">Total topics</p>
        <p
          className="mt-3 text-4xl font-black text-[var(--voc-text)]"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {topics.length}
        </p>
      </div>
    </div>
  )

  return (
    <MainLayout
      eyebrow="Topics"
      title="Separate topic management for a cleaner workflow."
      description="This page focuses only on learning themes, making topic organization easier to maintain and review."
      hero={hero}
      actionSlot={
        <button
          type="button"
          onClick={() => {
            setEditingTopicId(null)
            setTopicForm(emptyTopicForm())
          }}
          className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)]"
        >
          <Plus size={15} />
          New topic
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
              value={topicForm.name}
              onChange={(event) => setTopicForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Topic name"
              className="w-full rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3.5 text-sm outline-none transition-all focus:border-[var(--voc-accent)] focus:ring-4 focus:ring-[var(--voc-accent)]/10"
            />
            <input
              value={topicForm.description}
              onChange={(event) => setTopicForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Topic description"
              className="w-full rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3.5 text-sm outline-none transition-all focus:border-[var(--voc-accent)] focus:ring-4 focus:ring-[var(--voc-accent)]/10"
            />
            <div className="flex items-center gap-3">
              <input
                value={topicForm.colorHex}
                onChange={(event) => setTopicForm((current) => ({ ...current, colorHex: event.target.value }))}
                placeholder="#C51E3A"
                className="flex-1 rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3.5 text-sm outline-none transition-all focus:border-[var(--voc-accent)] focus:ring-4 focus:ring-[var(--voc-accent)]/10"
              />
              <div
                className="h-11 w-11 rounded-2xl border border-[var(--voc-border)]"
                style={{ backgroundColor: topicForm.colorHex || '#C51E3A' }}
              />
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  void submitTopic()
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-5 py-3.5 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)]"
              >
                <Save size={15} />
                {editingTopicId ? 'Update topic' : 'Create topic'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setEditingTopicId(null)
                  setTopicForm(emptyTopicForm())
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
                Existing learning themes
              </h2>
            </div>
            <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
              <Layers3 size={18} />
            </div>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-3xl border border-dashed border-[var(--voc-border)] bg-[var(--voc-panel-muted)] px-5 py-16 text-center text-sm text-[var(--voc-text-soft)]">
                Loading topics...
              </div>
            ) : topics.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-[var(--voc-border)] bg-[var(--voc-panel-muted)] px-5 py-16 text-center text-sm text-[var(--voc-text-soft)]">
                No topics available yet.
              </div>
            ) : (
              topics.map((topic) => (
                <div key={topic.id} className="rounded-[26px] border border-[var(--voc-border)] bg-[var(--voc-panel-muted)] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-full" style={{ backgroundColor: topic.colorHex }} />
                        <p className="font-semibold text-[var(--voc-text)]">{topic.name}</p>
                      </div>
                      <p className="mt-1 text-sm leading-6 text-[var(--voc-text-soft)]">
                        {topic.description || 'No description'}
                      </p>
                      <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[var(--voc-accent)]/70">
                        {topic.vocabularyCount} words
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTopicId(topic.id)
                          setTopicForm({
                            name: topic.name,
                            description: topic.description,
                            colorHex: topic.colorHex,
                          })
                        }}
                        className="rounded-xl p-2 text-[var(--voc-text)] hover:bg-[var(--voc-accent-soft)] hover:text-[var(--voc-accent)]"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleDeleteTopic(topic.id)
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
