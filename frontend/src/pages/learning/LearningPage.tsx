import { useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Flame,
  GraduationCap,
  Layers3,
  Play,
  Sparkles,
} from 'lucide-react'
import MainLayout from '../../layouts/MainLayout'
import { useAuth } from '../../hooks/useAuth'
import { learningApi } from '../../api/learningApi'
import { vocabApi } from '../../api/vocabApi'
import type { LearningDirection, LearningProgressResponse } from '../../types/learning'
import type { Band, Topic } from '../../types/vocabulary'

function SummaryTile({
  label,
  value,
  detail,
}: {
  label: string
  value: string
  detail: string
}) {
  return (
    <div className="rounded-[24px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-5 shadow-[0_14px_40px_var(--voc-shadow-soft)] voc-fade-up">
      <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--voc-text-soft)]">{label}</p>
      <p
        className="mt-3 text-3xl font-black text-[var(--voc-text)]"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-[var(--voc-text-soft)]">{detail}</p>
    </div>
  )
}

function ChoiceCard({
  title,
  description,
  active,
  onClick,
}: {
  title: string
  description: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-[24px] border px-4 py-4 text-left transition-all duration-300 hover:-translate-y-0.5"
      style={{
        borderColor: active ? 'rgba(197,30,58,0.28)' : 'var(--voc-border)',
        background: active
          ? 'linear-gradient(180deg, rgba(255,241,243,1) 0%, rgba(255,255,255,0.96) 100%)'
          : 'var(--voc-panel)',
        boxShadow: active ? '0 18px 32px rgba(145, 34, 54, 0.12)' : '0 10px 24px rgba(145, 34, 54, 0.04)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[var(--voc-text)]">{title}</p>
          <p className="mt-2 text-sm leading-6 text-[var(--voc-text-soft)]">{description}</p>
        </div>
        {active && (
          <span className="rounded-full bg-[var(--voc-accent-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--voc-accent)]">
            Selected
          </span>
        )}
      </div>
    </button>
  )
}

function InfoRow({ label, text, icon }: { label: string; text: string; icon: ReactNode }) {
  return (
    <div className="flex items-start gap-3 rounded-[20px] bg-[var(--voc-panel-muted)] px-4 py-4">
      <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-2.5 text-[var(--voc-accent)]">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-[var(--voc-text)]">{label}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--voc-text-soft)]">{text}</p>
      </div>
    </div>
  )
}

const directionLabels: Record<LearningDirection, string> = {
  'English_to_Vietnamese': 'English to Vietnamese',
  'Vietnamese_to_English': 'Vietnamese to English',
}

export default function LearningPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const [bands, setBands] = useState<Band[]>([])
  const [topics, setTopics] = useState<Topic[]>([])
  const [progress, setProgress] = useState<LearningProgressResponse | null>(null)
  const [mode, setMode] = useState<'mixed' | 'band' | 'topic'>('mixed')
  const [direction, setDirection] = useState<LearningDirection>('English_to_Vietnamese')
  const [bandId, setBandId] = useState<number | ''>('')
  const [topicId, setTopicId] = useState<number | ''>('')
  const [itemCount, setItemCount] = useState(8)
  const [isLoading, setIsLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const [progressResponse, bandsResponse, topicsResponse] = await Promise.all([
          learningApi.getProgress(),
          vocabApi.getBands('', 1, 100),
          vocabApi.getTopics('', 1, 100),
        ])

        setProgress(progressResponse)
        setBands(bandsResponse.items)
        setTopics(topicsResponse.items)
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unable to load your learning overview.'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    void loadData()
  }, [])

  const startSession = async () => {
    setIsStarting(true)
    setError(null)

    try {
      const response = await learningApi.startSession({
        mode,
        direction,
        bandId: mode === 'band' && bandId !== '' ? bandId : undefined,
        topicId: mode === 'topic' && topicId !== '' ? topicId : undefined,
        itemCount,
      })

      navigate(`/learning/review/${response.session.id}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'We could not start your review right now.'
      setError(message)
    } finally {
      setIsStarting(false)
    }
  }

  const startDisabled = isStarting || (mode === 'band' && bandId === '') || (mode === 'topic' && topicId === '')

  const hero = (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="voc-shimmer relative overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,var(--voc-accent-strong)_0%,var(--voc-accent)_48%,var(--voc-accent-bright)_100%)] p-6 text-white shadow-[0_28px_54px_rgba(134,16,39,0.22)]">
        <div className="voc-float-soft absolute right-6 top-6 h-20 w-20 rounded-full border border-white/14 bg-white/10 blur-[1px]" />
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 backdrop-blur-md">
            <Sparkles size={14} />
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
              Review Space
            </span>
          </div>
          <h2
            className="mt-6 text-[34px] font-black leading-tight tracking-[-0.05em]"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Review pages for you to practice your words.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-white/84">
            Choose how you want to review, how many cards you want to see, and the system will prepare a focused session for you.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
        <SummaryTile
          label="Sessions"
          value={String(progress?.overview.totalSessions ?? 0)}
          detail="Review sessions you have started so far."
        />
        <SummaryTile
          label="Best streak"
          value={String(progress?.overview.bestAnswerStreak ?? 0)}
          detail="Best number of correct answers in a row."
        />
        <SummaryTile
          label="Mastery"
          value={`${progress?.overview.averageMasteryScore ?? 0}%`}
          detail="Average confidence level across reviewed words."
        />
      </div>
    </div>
  )

  return (
    <MainLayout
      eyebrow="Learning"
      title="Start a review session"
      description="Practice your English here."
      hero={hero}
      actionSlot={
        <button
          type="button"
          onClick={() => {
            void startSession()
          }}
          disabled={startDisabled}
          className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
        >
          <Play size={16} />
          {isStarting ? 'Preparing session...' : 'Begin review'}
        </button>
      }
    >
      {error && (
        <div className="mb-6 rounded-3xl border border-[var(--voc-border)] bg-[var(--voc-accent-soft)] px-5 py-4 text-sm text-[var(--voc-accent)] voc-fade-up">
          {error}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-6">
          <div className="rounded-[30px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] voc-fade-up sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--voc-accent)]/70">
                  Session details
                </p>
                <h2
                  className="mt-2 text-[30px] font-black tracking-[-0.04em] text-[var(--voc-text)]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Choose your review setup
                </h2>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--voc-text-soft)]">
                  These options shape what will appear in your session and how you will answer.
                </p>
              </div>
              <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
                <Play size={18} />
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold text-[var(--voc-text)]">1. Select a review source</p>
                <p className="mt-1 text-sm leading-6 text-[var(--voc-text-soft)]">
                  Decide whether the session should draw cards from your full library, one band, or one topic.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <ChoiceCard
                    title="All words"
                    description="A balanced mix from your library."
                    active={mode === 'mixed'}
                    onClick={() => setMode('mixed')}
                  />
                  <ChoiceCard
                    title="One band"
                    description="Review words from a selected IELTS level."
                    active={mode === 'band'}
                    onClick={() => setMode('band')}
                  />
                  <ChoiceCard
                    title="One topic"
                    description="Stay focused on a single theme."
                    active={mode === 'topic'}
                    onClick={() => setMode('topic')}
                  />
                </div>
              </div>

              {mode === 'band' && (
                <div className="voc-fade-up">
                  <label className="text-sm font-semibold text-[var(--voc-text)]">Band</label>
                  <p className="mt-1 text-sm leading-6 text-[var(--voc-text-soft)]">
                    Choose the level you want to practice in this session.
                  </p>
                  <select
                    value={bandId}
                    onChange={(event) => setBandId(event.target.value ? Number(event.target.value) : '')}
                    className="mt-3 w-full rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3.5 text-sm outline-none transition-all focus:border-[var(--voc-accent)]"
                  >
                    <option value="">Select a band</option>
                    {bands.map((band) => (
                      <option key={band.id} value={band.id}>
                        {band.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {mode === 'topic' && (
                <div className="voc-fade-up">
                  <label className="text-sm font-semibold text-[var(--voc-text)]">Topic</label>
                  <p className="mt-1 text-sm leading-6 text-[var(--voc-text-soft)]">
                    Choose the theme you want to stay with during review.
                  </p>
                  <select
                    value={topicId}
                    onChange={(event) => setTopicId(event.target.value ? Number(event.target.value) : '')}
                    className="mt-3 w-full rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3.5 text-sm outline-none transition-all focus:border-[var(--voc-accent)]"
                  >
                    <option value="">Select a topic</option>
                    {topics.map((topic) => (
                      <option key={topic.id} value={topic.id}>
                        {topic.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <p className="text-sm font-semibold text-[var(--voc-text)]">2. Choose the answer direction</p>
                <p className="mt-1 text-sm leading-6 text-[var(--voc-text-soft)]">
                  This determines the language you see first and the language you will type back.
                </p>
                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <ChoiceCard
                    title="English to Vietnamese"
                    description="See the English word and type its meaning."
                    active={direction === 'English_to_Vietnamese'}
                    onClick={() => setDirection('English_to_Vietnamese')}
                  />
                  <ChoiceCard
                    title="Vietnamese to English"
                    description="See the meaning first and type the English word."
                    active={direction === 'Vietnamese_to_English'}
                    onClick={() => setDirection('Vietnamese_to_English')}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--voc-text)]">3. Decide the session length</p>
                    <p className="mt-1 text-sm leading-6 text-[var(--voc-text-soft)]">
                      Short sessions are easier to finish. Longer sessions give you a deeper review.
                    </p>
                  </div>
                  <div
                    className="rounded-full bg-[var(--voc-accent-soft)] px-4 py-2 text-sm font-bold text-[var(--voc-accent)] voc-fade-up"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {itemCount} cards
                  </div>
                </div>
                <input
                  type="range"
                  min={4}
                  max={20}
                  step={1}
                  value={itemCount}
                  onChange={(event) => setItemCount(Number(event.target.value))}
                  className="mt-4 w-full accent-[var(--voc-accent)]"
                />
                <div className="mt-3 flex items-center justify-between text-xs uppercase tracking-[0.16em] text-[var(--voc-text-soft)]">
                  <span>Quick</span>
                  <span>Balanced</span>
                  <span>Deep</span>
                </div>
              </div>

              <div className="rounded-[24px] bg-[var(--voc-panel-muted)] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--voc-accent)]/70">
                      Ready to start
                    </p>
                    <p className="mt-3 text-sm leading-7 text-[var(--voc-text-soft)]">
                      Your session will use <span className="font-semibold text-[var(--voc-text)]">{directionLabels[direction]}</span>,
                      {mode === 'mixed' && ' all available words, '}
                      {mode === 'band' && ' the selected band, '}
                      {mode === 'topic' && ' the selected topic, '}
                      and <span className="font-semibold text-[var(--voc-text)]">{itemCount} cards</span>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      void startSession()
                    }}
                    disabled={startDisabled}
                    className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-55"
                  >
                    {isStarting ? 'Preparing...' : 'Begin review'}
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] voc-fade-up sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--voc-accent)]/70">
                  Continue where you left off
                </p>
                <h2
                  className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Recent sessions
                </h2>
              </div>
              <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
                <Clock3 size={18} />
              </div>
            </div>

            <div className="space-y-3">
              {isLoading ? (
                <div className="rounded-[24px] border border-dashed border-[var(--voc-border)] bg-[var(--voc-panel-muted)] px-5 py-12 text-center text-sm text-[var(--voc-text-soft)]">
                  Loading your sessions...
                </div>
              ) : progress?.recentSessions.length ? (
                progress.recentSessions.map((session) => (
                  <button
                    key={session.id}
                    type="button"
                    onClick={() => navigate(`/learning/review/${session.id}`)}
                    className="flex w-full items-center justify-between rounded-[24px] border border-[var(--voc-border)] bg-[var(--voc-panel-muted)] px-4 py-4 text-left transition-all hover:-translate-y-0.5"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--voc-text)]">Session #{session.id}</p>
                      <p className="mt-1 text-sm text-[var(--voc-text-soft)]">
                        {directionLabels[session.direction]} · {session.completedItems}/{session.totalItems} completed
                      </p>
                    </div>
                    <span className="rounded-full bg-[var(--voc-accent-soft)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--voc-accent)]">
                      {session.status}
                    </span>
                  </button>
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[var(--voc-border)] bg-[var(--voc-panel-muted)] px-5 py-12 text-center text-sm text-[var(--voc-text-soft)]">
                  Your review history will appear here after your first session.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-[30px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] voc-fade-up sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--voc-accent)]/70">
                  What each number means
                </p>
                <h2
                  className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Your learning overview
                </h2>
              </div>
              <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
                <CheckCircle2 size={18} />
              </div>
            </div>

            <div className="space-y-3">
              <InfoRow
                label="Study streak"
                text={`${progress?.overview.currentStudyStreakDays ?? 0} day(s) with recent activity.`}
                icon={<Flame size={16} />}
              />
              <InfoRow
                label="Best answer streak"
                text={`${progress?.overview.bestAnswerStreak ?? 0} correct answer(s) in a row.`}
                icon={<CheckCircle2 size={16} />}
              />
              <InfoRow
                label="Words mastered"
                text={`${progress?.overview.masteredWords ?? 0} word(s) have reached a strong confidence level.`}
                icon={<Sparkles size={16} />}
              />
            </div>
          </div>

          <div className="rounded-[30px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] voc-fade-up sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--voc-accent)]/70">
                  Coverage
                </p>
                <h2
                  className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Progress by band
                </h2>
              </div>
              <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
                <GraduationCap size={18} />
              </div>
            </div>

            <div className="space-y-4">
              {progress?.bandProgress.slice(0, 5).map((band) => (
                <div key={band.bandId}>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[var(--voc-text)]">{band.bandName}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--voc-text-soft)]">
                      {band.reviewedWords}/{band.totalWords}
                    </p>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-[var(--voc-surface-strong)]">
                    <div
                      className="h-full rounded-full bg-[linear-gradient(135deg,var(--voc-accent-strong)_0%,var(--voc-accent)_100%)] transition-all duration-700"
                      style={{
                        width: `${band.totalWords === 0 ? 0 : (band.reviewedWords / band.totalWords) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[30px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] voc-fade-up sm:p-7">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--voc-accent)]/70">
                  Focus area
                </p>
                <h2
                  className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  Topics to revisit
                </h2>
              </div>
              <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
                <Layers3 size={18} />
              </div>
            </div>

            <div className="space-y-3">
              {progress?.topicProgress.slice(0, 4).map((topic) => (
                <div key={topic.topicId} className="flex items-center justify-between rounded-[20px] bg-[var(--voc-panel-muted)] px-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: topic.colorHex }} />
                    <div>
                      <p className="text-sm font-semibold text-[var(--voc-text)]">{topic.topicName}</p>
                      <p className="mt-1 text-sm text-[var(--voc-text-soft)]">
                        {topic.reviewedWords}/{topic.totalWords} reviewed
                      </p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-[var(--voc-accent)]">
                    {topic.averageMasteryScore}%
                  </span>
                </div>
              ))}

              {!progress?.topicProgress.length && (
                <div className="rounded-[20px] bg-[var(--voc-panel-muted)] px-4 py-8 text-sm text-[var(--voc-text-soft)]">
                  Topic progress will appear after you review a few sessions.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </MainLayout>
  )
}
