import { useEffect, type ElementType } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookOpen,
  Clock3,
  Flame,
  GraduationCap,
  Hash,
  Mail,
  Shield,
  Sparkles,
  Star,
  Target,
  Trophy,
  User,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import MainLayout from '../../layouts/MainLayout'

function getInitials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function LoadingState() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-16 w-16 animate-spin rounded-full border-4"
          style={{ borderColor: 'rgba(197,30,58,0.18)', borderTopColor: '#C51E3A' }}
        />
        <p className="text-sm text-[var(--voc-text-soft)]">Loading your profile through the gateway...</p>
      </div>
    </div>
  )
}

function RoleBadge({ role }: { role: string }) {
  const isAdmin = role.toLowerCase() === 'admin'

  return (
    <span
      className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.18em]"
      style={
        isAdmin
          ? {
              background: 'linear-gradient(135deg, var(--voc-accent-strong) 0%, var(--voc-accent) 100%)',
              color: '#FFFFFF',
              boxShadow: '0 10px 24px rgba(197,30,58,0.22)',
            }
          : {
              background: 'var(--voc-accent-soft)',
              color: 'var(--voc-accent)',
              border: '1px solid var(--voc-border)',
            }
      }
    >
      <Shield size={12} />
      {role}
    </span>
  )
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-[var(--voc-border)] bg-[var(--voc-panel-muted)] px-4 py-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--voc-surface-strong)] text-[var(--voc-accent)]">
        <Icon size={17} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--voc-text-soft)]">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold text-[var(--voc-text)]">{value}</p>
      </div>
    </div>
  )
}

function MetricCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: ElementType
  label: string
  value: string
  accent: string
}) {
  return (
    <div className="rounded-[28px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-5 shadow-[0_14px_40px_var(--voc-shadow-soft)] backdrop-blur-md">
      <div className="flex items-center justify-between">
        <div className="rounded-2xl p-3" style={{ background: `${accent}16`, color: accent }}>
          <Icon size={18} />
        </div>
        <Sparkles size={16} style={{ color: accent }} />
      </div>
      <p
        className="mt-5 text-3xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
        style={{ fontFamily: "'Montserrat', sans-serif" }}
      >
        {value}
      </p>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--voc-text-soft)]">{label}</p>
    </div>
  )
}

function ActionCard({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: ElementType
  title: string
  description: string
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-[26px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-5 text-left shadow-[0_10px_28px_var(--voc-shadow-soft)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--voc-accent)]/20 hover:shadow-[0_20px_40px_var(--voc-shadow-soft)]"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--voc-surface-strong)] text-[var(--voc-accent)]">
        <Icon size={18} />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-[var(--voc-text)]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--voc-text-soft)]">{description}</p>
      </div>
      <div className="text-[var(--voc-text-soft)] transition-transform duration-300 group-hover:translate-x-1">
        <Sparkles size={16} />
      </div>
    </button>
  )
}

export default function ProfilePage() {
  const navigate = useNavigate()
  const { user, fetchProfile, isAuthenticated, isLoading, error } = useAuth()

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

  const initials = user?.fullName ? getInitials(user.fullName) : 'VO'
  const roles = user?.roles?.length ? user.roles : ['User']

  const hero = (
    <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[30px] bg-[linear-gradient(135deg,var(--voc-accent-strong)_0%,var(--voc-accent)_45%,var(--voc-accent-bright)_100%)] p-6 text-white shadow-[0_28px_54px_rgba(134,16,39,0.24)]">
        <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 backdrop-blur-md">
          <Flame size={14} />
          <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-white/80">
            Dashboard layout
          </span>
        </div>

        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-end">
          <div
            className="flex h-24 w-24 items-center justify-center rounded-[28px] border border-white/18 bg-white/14 text-3xl font-black shadow-[0_16px_32px_rgba(0,0,0,0.18)] backdrop-blur-md"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            {initials}
          </div>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/62">
              Account overview
            </p>
            <h2
              className="mt-2 text-[34px] font-black leading-tight tracking-[-0.04em]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              {user?.fullName ?? 'T&T Student'}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-7 text-white/76">
              The new main shell, responsive navigation, and theme system now sit on top of your
              authenticated dashboard experience.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {roles.map((role) => (
            <RoleBadge key={role} role={role} />
          ))}
          {user?.id != null && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85">
              <Hash size={12} />
              ID {user.id}
            </span>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
        <MetricCard icon={Target} label="Current focus" value="Band 7.5" accent="#ffffff" />
        <MetricCard icon={Trophy} label="Momentum" value="Elite" accent="#CF4154" />
        <MetricCard icon={Clock3} label="Session mode" value="Live" accent="#A5122B" />
      </div>
    </div>
  )

  return (
    <MainLayout
      eyebrow="Main Layout + Dashboard Layout"
      title="Your IELTS command center is now unified."
      description="Phase 2.1 brings the authenticated pages into one responsive shell with consistent navigation, reusable surfaces, and a switchable red-white theme system."
      hero={hero}
      actionSlot={
        <button
          type="button"
          onClick={() => navigate('/vocabulary')}
          className="inline-flex items-center gap-2 rounded-2xl bg-[linear-gradient(135deg,var(--voc-accent)_0%,var(--voc-accent-strong)_100%)] px-4 py-3 text-sm font-bold text-white shadow-[0_14px_28px_var(--voc-shadow-soft)]"
        >
          <BookOpen size={16} />
          Open Vocabulary
        </button>
      }
    >
      {error && user && (
        <div className="mb-6 rounded-3xl border border-[var(--voc-border)] bg-[var(--voc-accent-soft)] px-5 py-4 text-sm text-[var(--voc-accent)]">
          {error}
        </div>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] backdrop-blur-md sm:p-7">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--voc-accent)]/70">
                Account details
              </p>
              <h2
                className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                Your authenticated profile
              </h2>
            </div>
            <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
              <User size={18} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <DetailRow icon={User} label="Full Name" value={user?.fullName ?? '-'} />
            <DetailRow icon={Mail} label="Email" value={user?.email ?? '-'} />
            <DetailRow icon={Shield} label="Roles" value={roles.join(', ')} />
            <DetailRow icon={Hash} label="User ID" value={user?.id != null ? `#${user.id}` : '-'} />
          </div>
        </div>

        <div className="rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] backdrop-blur-md sm:p-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--voc-accent)]/70">
            Snapshot
          </p>
          <h2
            className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            Performance energy
          </h2>
          <div className="mt-6 space-y-4">
            <MetricCard icon={GraduationCap} label="Learning level" value="Advanced" accent="#C51E3A" />
            <MetricCard icon={BookOpen} label="Focus track" value="IELTS" accent="#8B0000" />
            <MetricCard icon={Star} label="Status" value="Ready" accent="#F59E0B" />
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-[32px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 shadow-[0_18px_50px_var(--voc-shadow-soft)] backdrop-blur-md sm:p-7">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--voc-accent)]/70">
              Quick actions
            </p>
            <h2
              className="mt-2 text-2xl font-black tracking-[-0.04em] text-[var(--voc-text)]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              Continue the momentum
            </h2>
          </div>
          <div className="hidden rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)] sm:block">
            <Sparkles size={18} />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <ActionCard
            icon={BookOpen}
            title="Continue learning"
            description="The learning engine route is prepared in the navigation shell for the next phase."
          />
          <ActionCard
            icon={Trophy}
            title="Mock test"
            description="Keep space for premium IELTS exam simulation inside the same dashboard system."
          />
          <ActionCard
            icon={Star}
            title="Vocabulary sprint"
            description="Jump into the vocabulary workspace with the same unified responsive layout."
            onClick={() => navigate('/vocabulary')}
          />
        </div>
      </section>
    </MainLayout>
  )
}
