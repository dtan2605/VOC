import { useState, type PropsWithChildren, type ReactNode } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BookOpen,
  ChevronRight,
  Flame,
  GraduationCap,
  House,
  Layers3,
  LayoutDashboard,
  LogOut,
  Menu,
  MoonStar,
  Sparkles,
  SunMedium,
  UserRound,
  X,
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useTheme } from '../hooks/useTheme'

interface MainLayoutProps extends PropsWithChildren {
  eyebrow: string
  title: string
  description: string
  hero?: ReactNode
  actionSlot?: ReactNode
}

interface NavItem {
  to: string
  label: string
  description: string
  icon: typeof LayoutDashboard
  soon?: boolean
}

const navItems: NavItem[] = [
  {
    to: '/home',
    label: 'Home',
    description: 'Overview and guidance',
    icon: House,
  },
  {
    to: '/vocabulary',
    label: 'Words',
    description: 'Manage your vocabulary',
    icon: BookOpen,
  },
  {
    to: '/bands',
    label: 'Bands',
    description: 'Manage study levels',
    icon: GraduationCap,
  },
  {
    to: '/topics',
    label: 'Topics',
    description: 'Manage learning themes',
    icon: Layers3,
  },
  {
    to: '/learning',
    label: 'Learning',
    description: 'Review and quiz flow',
    icon: LayoutDashboard,
    soon: true,
  },
]

function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme()

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--voc-border)] bg-[var(--voc-panel)] px-3 py-2.5 text-sm font-semibold text-[var(--voc-text)] shadow-[0_10px_24px_var(--voc-shadow-soft)] transition-all hover:-translate-y-0.5"
    >
      {theme === 'classic' ? <SunMedium size={16} /> : <MoonStar size={16} />}
      <span>{theme === 'classic' ? 'Classic' : 'Editorial'}</span>
    </button>
  )
}

function NavigationContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation()

  return (
    <div className="space-y-2">
      {navItems.map((item) => {
        const isActive =
          !item.soon &&
          (location.pathname === item.to || location.pathname.startsWith(`${item.to}/`))
        const Icon = item.icon

        if (item.soon) {
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 rounded-[22px] border border-[var(--voc-border)] bg-[var(--voc-panel-muted)] px-4 py-4 text-[var(--voc-text-soft)] opacity-85"
            >
              <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
                <Icon size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-[var(--voc-text)]">{item.label}</p>
                  <span className="rounded-full bg-[var(--voc-accent-soft)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--voc-accent)]">
                    Soon
                  </span>
                </div>
                <p className="mt-1 text-xs leading-5">{item.description}</p>
              </div>
            </div>
          )
        }

        return (
          <NavLink
            key={item.label}
            to={item.to}
            onClick={onNavigate}
            className="group flex items-center gap-3 rounded-[22px] border px-4 py-4 transition-all duration-300"
            style={{
              borderColor: isActive ? 'rgba(255,255,255,0.12)' : 'var(--voc-border)',
              background: isActive ? 'linear-gradient(135deg, var(--voc-accent) 0%, var(--voc-accent-strong) 100%)' : 'var(--voc-panel-muted)',
              color: isActive ? '#ffffff' : 'var(--voc-text)',
              boxShadow: isActive ? '0 20px 36px rgba(159, 15, 39, 0.22)' : 'none',
            }}
          >
            <div
              className="rounded-2xl p-3 transition-all"
              style={{
                background: isActive ? 'rgba(255,255,255,0.14)' : 'var(--voc-surface-strong)',
                color: isActive ? '#ffffff' : 'var(--voc-accent)',
              }}
            >
              <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{item.label}</p>
              <p className={`mt-1 text-xs leading-5 ${isActive ? 'text-white/72' : 'text-[var(--voc-text-soft)]'}`}>
                {item.description}
              </p>
            </div>
            <ChevronRight
              size={16}
              className={`transition-transform duration-300 group-hover:translate-x-1 ${isActive ? 'text-white/80' : 'text-[var(--voc-text-soft)]'}`}
            />
          </NavLink>
        )
      })}
    </div>
  )
}

export default function MainLayout({
  eyebrow,
  title,
  description,
  hero,
  actionSlot,
  children,
}: MainLayoutProps) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/auth', { replace: true })
  }

  return (
    <div className="min-h-screen bg-[var(--voc-app-bg)] text-[var(--voc-text)] transition-colors duration-300">
      <div className="mx-auto flex min-h-screen max-w-[1600px]">
        <aside className="hidden w-[320px] shrink-0 border-r border-[var(--voc-border)] bg-[var(--voc-sidebar-bg)] px-6 py-6 xl:flex xl:flex-col">
          <div className="rounded-[30px] border border-white/10 bg-[linear-gradient(145deg,var(--voc-accent-strong)_0%,var(--voc-accent)_48%,var(--voc-accent-bright)_100%)] p-6 text-white shadow-[0_26px_50px_rgba(109,0,19,0.28)]">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/10 px-3 py-1.5 backdrop-blur-md">
              <Flame size={13} />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/82">
                IELTS Vocabulary Workspace
              </span>
            </div>
            <h1
              className="mt-5 text-5xl font-black tracking-[-0.08em]"
              style={{ fontFamily: "'Montserrat', sans-serif" }}
            >
              T&T
            </h1>
            <p className="mt-4 text-sm leading-7 text-white/78">
              A clean red-white study space to manage words, levels, and learning themes without
              crowding everything into one screen.
            </p>
          </div>

          <div className="mt-6 rounded-[28px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-5 shadow-[0_16px_40px_var(--voc-shadow-soft)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--voc-accent)]">
              Workspace Navigation
            </p>
            <div className="mt-4">
              <NavigationContent />
            </div>
          </div>

          <div className="mt-auto rounded-[28px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-5 shadow-[0_16px_40px_var(--voc-shadow-soft)]">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--voc-accent)]">
              Theme Direction
            </p>
            <p className="mt-3 text-sm leading-6 text-[var(--voc-text-soft)]">
              Switch between two red-white looks while keeping the same calm study structure.
            </p>
            <div className="mt-4">
              <ThemeSwitcher />
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-[var(--voc-border)] bg-[var(--voc-topbar-bg)]/92 backdrop-blur-xl">
            <div className="flex items-center justify-between gap-4 px-5 py-4 sm:px-8">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMobileOpen(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--voc-border)] bg-[var(--voc-panel)] text-[var(--voc-text)] shadow-[0_10px_24px_var(--voc-shadow-soft)] xl:hidden"
                >
                  <Menu size={18} />
                </button>
                <div className="rounded-2xl bg-[var(--voc-panel)] px-3 py-2 shadow-[0_10px_24px_var(--voc-shadow-soft)]">
                  <span
                    className="text-2xl font-black tracking-[-0.08em] text-[var(--voc-accent)]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    T&T
                  </span>
                </div>
                <div className="hidden sm:block">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--voc-accent)]/70">
                    {eyebrow}
                  </p>
                  <p className="mt-1 text-sm text-[var(--voc-text-soft)]">{description}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="hidden lg:block">{actionSlot}</div>
                <ThemeSwitcher />
                <button
                  type="button"
                  onClick={() => { void handleLogout() }}
                  className="inline-flex items-center gap-2 rounded-2xl border border-[var(--voc-border)] bg-[var(--voc-panel)] px-4 py-2.5 text-sm font-medium text-[var(--voc-text)] shadow-[0_10px_24px_var(--voc-shadow-soft)] transition-all hover:-translate-y-0.5"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-5 py-6 sm:px-8 sm:py-8">
            <div className="mb-6 rounded-[34px] border border-[var(--voc-border)] bg-[var(--voc-hero-bg)] p-6 shadow-[0_20px_50px_var(--voc-shadow-soft)] sm:p-8">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--voc-border)] bg-[var(--voc-panel)] px-3 py-1.5 text-[var(--voc-accent)] shadow-[0_10px_24px_var(--voc-shadow-soft)]">
                    <Sparkles size={13} />
                    <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                      Unified app shell
                    </span>
                  </div>
                  <h1
                    className="mt-5 text-[32px] font-black leading-tight tracking-[-0.05em] text-[var(--voc-text)] sm:text-[40px]"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {title}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--voc-text-soft)]">
                    {description}
                  </p>
                </div>
                <div className="lg:hidden">{actionSlot}</div>
              </div>
              {hero && <div className="mt-6">{hero}</div>}
            </div>

            {children}
          </main>
        </div>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 xl:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={() => setMobileOpen(false)}
          />
          <div className="relative h-full max-w-[340px] overflow-y-auto border-r border-[var(--voc-border)] bg-[var(--voc-sidebar-bg)] p-5 shadow-[0_24px_50px_rgba(0,0,0,0.2)]">
            <div className="flex items-center justify-between">
              <div className="rounded-2xl bg-[var(--voc-panel)] px-3 py-2 shadow-[0_10px_24px_var(--voc-shadow-soft)]">
                <span
                  className="text-2xl font-black tracking-[-0.08em] text-[var(--voc-accent)]"
                  style={{ fontFamily: "'Montserrat', sans-serif" }}
                >
                  T&T
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[var(--voc-border)] bg-[var(--voc-panel)] text-[var(--voc-text)]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-6 rounded-[28px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-5 shadow-[0_16px_40px_var(--voc-shadow-soft)]">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-[var(--voc-surface-strong)] p-3 text-[var(--voc-accent)]">
                  <UserRound size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--voc-text)]">T&T Workspace</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--voc-text-soft)]">
                    Organized pages for the current learning tools.
                  </p>
                </div>
              </div>
              <div className="mt-5">
                <NavigationContent onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="mt-5 border-t border-[var(--voc-border)] pt-5">
                <ThemeSwitcher />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
