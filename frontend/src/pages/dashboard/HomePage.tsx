import { useEffect, type ElementType } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Bot,
  Compass,
  GraduationCap,
  Layers3,
  Sparkles,
  Target,
} from 'lucide-react'
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

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[26px] border border-[var(--voc-border)] bg-[var(--voc-panel-muted)] p-5">
      <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--voc-accent)]/70">
        {title}
      </p>
      <p className="mt-3 text-sm leading-7 text-[var(--voc-text-soft)]">{text}</p>
    </div>
  )
}

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

  const hero = (
    <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[30px] bg-[linear-gradient(135deg,var(--voc-accent-strong)_0%,var(--voc-accent)_45%,var(--voc-accent-bright)_100%)] p-6 text-white shadow-[0_28px_54px_rgba(134,16,39,0.24)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 backdrop-blur-md">
          <Compass size={14} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
            Website Overview
          </span>
        </div>

        <h2
          className="mt-6 text-[34px] font-black leading-tight tracking-[-0.05em]"
          style={{ fontFamily: "'Montserrat', sans-serif" }}
        >
          {user?.fullName ? `Welcome, ${user.fullName}.` : 'Welcome to T&T Vocabulary.'}
        </h2>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-white/82">
          This website helps you build English vocabulary, group words by IELTS band and topic,
          and prepare for review sessions in a simpler, more organized workspace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
        {[
          ['Words', 'Add, search, and edit vocabulary'],
          ['Bands', 'Organize by learning level'],
          ['Topics', 'Group words by theme'],
        ].map(([label, text]) => (
          <div key={label} className="rounded-[28px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-5 shadow-[0_14px_40px_var(--voc-shadow-soft)]">
            <p className="text-[11px] uppercase tracking-[0.24em] text-[var(--voc-text-soft)]">{label}</p>
            <p
              className="mt-3 text-xl font-black text-[var(--voc-text)]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {text}
            </p>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <MainLayout
      eyebrow="Home"
      title="A simpler homepage for your vocabulary system."
      description="After signing in, you now land on a clean overview page that explains what each section is used for."
      hero={hero}
      actionSlot={
        <button
          type="button"
          onClick={() => navigate('/vocabulary')}
          className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)]"
        >
          <BookOpen size={16} />
          Start with words
        </button>
      }
    >
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
        <FeatureCard
          icon={Sparkles}
          title="Review"
          description="According to the SRS, this section will let you review vocabulary by band or topic in flashcard and quiz form."
          cta="Coming soon"
          soon
        />
        <FeatureCard
          icon={Target}
          title="Goals"
          description="This area will support target band tracking so you can connect your vocabulary growth to a study objective."
          cta="Coming soon"
          soon
        />
        <FeatureCard
          icon={Bot}
          title="AI Support"
          description="The system is designed to auto-support new words with part of speech, pronunciation, meaning, and examples."
          cta="Coming soon"
          soon
        />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-3">
        <InfoCard
          title="What this website does"
          text="It is a web-based English vocabulary learning system focused on adding words, organizing them clearly, and preparing users for regular review."
        />
        <InfoCard
          title="How to use it"
          text="Start from Words to add vocabulary, then create Bands and Topics to structure your library before moving to review features."
        />
        <InfoCard
          title="Design direction"
          text="The interface is kept concise and clean so each page has one main job, making the workspace easier to use and manage."
        />
      </section>
    </MainLayout>
  )
}
