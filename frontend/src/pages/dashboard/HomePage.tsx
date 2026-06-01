import { useEffect, type ElementType } from 'react'
import { useNavigate } from 'react-router-dom'
import { BookOpen, GraduationCap, Layers3 } from 'lucide-react'
import AnalyticsDashboard from '../analytics/AnalyticsDashboard'
import MainLayout from '../../layouts/MainLayout'
import { useAuth } from '../../hooks/useAuth'

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-16 w-16 animate-spin rounded-full border-4"
          style={{ borderColor: 'rgba(197,30,58,0.18)', borderTopColor: '#C51E3A' }}
        />
        <p className="text-sm text-[var(--voc-text-soft)]">Loading your workspace...</p>
      </div>
    </div>
  )
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  cta,
  onClick,
  soon = false,
}: {
  icon: ElementType
  title: string
  description: string
  cta: string
  onClick?: () => void
  soon?: boolean
}) {
  return (
    <div className="rounded-[30px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)]">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
          <Icon size={18} />
        </div>
        <span
          className="rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em]"
          style={
            soon
              ? {
                  background: 'var(--voc-surface-strong)',
                  color: 'var(--voc-text-soft)',
                }
              : {
                  background: 'var(--voc-accent-soft)',
                  color: 'var(--voc-accent)',
                }
          }
        >
          {soon ? 'Soon' : 'Ready'}
        </span>
      </div>

      <h2
        className="mt-5 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {title}
      </h2>
      <p className="mt-3 text-sm leading-7 text-[var(--voc-text-soft)]">{description}</p>

      <button
        type="button"
        disabled={soon}
        onClick={onClick}
        className="mt-6 rounded-2xl border border-[var(--voc-border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--voc-text)] transition-all disabled:cursor-not-allowed disabled:opacity-55"
      >
        {cta}
      </button>
    </div>
  )
}

// InfoCard removed — Home now shows AnalyticsDashboard by default

export default function HomePage() {
  const navigate = useNavigate()
  const { user, fetchProfile, isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { replace: true })
      return
    }

    if (!user) {
      void fetchProfile()
    }
  }, [fetchProfile, isAuthenticated, navigate, user])

  if (isLoading && !user) {
    return <LoadingState />
  }

  const showAnalytics = true

  return (
    <MainLayout
      eyebrow="Home"
      title="Analytics Overview"
      description="Key study metrics and progress from AnalyticsService"
      actionSlot={
        <button
          type="button"
          onClick={() => navigate('/profile')}
          className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)]"
        >
          <BookOpen size={16} />
          Profile
        </button>
      }
    >
      {showAnalytics ? (
        <div>
          <AnalyticsDashboard />
          <div className="mt-8 rounded-[20px] border border-[var(--voc-border)] bg-white p-8 shadow-[0_12px_30px_rgba(0,0,0,0.06)]">
            <h3 style={{ color: '#111', fontSize: 20, fontWeight: 800 }}>About VOC</h3>
            <p style={{ color: '#444', marginTop: 8 }}>
              VOC helps you learn vocabulary through short, focused review sessions. Track your mastery and streaks on the homepage, practice daily, and watch
              your progress grow. The interface emphasizes clarity with white, red, and black tones for a premium feel.
            </p>
            <p style={{ color: '#666', marginTop: 10, fontSize: 13 }}>
              Built for learners who want fast, reliable practice and clear analytics. Try beginning a session to see real-time updates in your analytics.
            </p>
          </div>
        </div>
      ) : (
        <section className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <FeatureCard
            icon={BookOpen}
            title="Words"
            description="Manage your vocabulary list, search quickly, filter by band or topic, and open each word to see details and flashcards."
            cta="Open words"
            onClick={() => navigate('/vocabulary')}
          />
          <FeatureCard
            icon={GraduationCap}
            title="Bands"
            description="Create and manage IELTS band groups so your vocabulary stays organized by level and easier to review later."
            cta="Open bands"
            onClick={() => navigate('/bands')}
          />
          <FeatureCard
            icon={Layers3}
            title="Topics"
            description="Build topic collections such as travel, science, or business to keep related vocabulary together."
            cta="Open topics"
            onClick={() => navigate('/topics')}
          />
        </section>
      )}
    </MainLayout>
  )
}
