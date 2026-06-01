import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Flame,
  Lock,
  Loader2,
  Mail,
  Sparkles,
  User,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type LoginFormData = z.infer<typeof loginSchema>
type RegisterFormData = z.infer<typeof registerSchema>

interface InputFieldProps {
  id: string
  type: string
  placeholder: string
  hasError: boolean
  inputProps: InputHTMLAttributes<HTMLInputElement>
  leftIcon: ReactNode
  rightSlot?: ReactNode
}

function InputField({
  id,
  type,
  placeholder,
  hasError,
  inputProps,
  leftIcon,
  rightSlot,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false)

  return (
    <div
      className="group flex items-center rounded-2xl border bg-white transition-all duration-300"
      style={{
        borderColor: hasError ? '#C51E3A' : focused ? '#C51E3A' : '#E7E5E4',
        boxShadow: focused ? '0 0 0 4px rgba(197,30,58,0.08), 0 12px 30px rgba(197,30,58,0.12)' : 'none',
      }}
    >
      <div className="pl-4 text-voc-gray transition-colors duration-300 group-focus-within:text-voc-red">
        {leftIcon}
      </div>
      <input
        {...inputProps}
        id={id}
        type={type}
        placeholder={placeholder}
        onFocus={(event) => {
          setFocused(true)
          inputProps.onFocus?.(event)
        }}
        onBlur={(event) => {
          setFocused(false)
          inputProps.onBlur?.(event)
        }}
        className="min-w-0 flex-1 bg-transparent px-3 py-4 text-sm text-voc-dark placeholder:text-voc-gray/45 outline-none"
      />
      {rightSlot}
    </div>
  )
}

function BrandPanel() {
  return (
    <section
      className="relative hidden overflow-hidden lg:flex lg:w-[56%] lg:flex-col lg:justify-between"
      style={{
        background: 'radial-gradient(circle at 18% 20%, rgba(255,255,255,0.18), transparent 26%), linear-gradient(145deg, #47000D 0%, #6B0010 22%, #8F0C1D 52%, #C51E3A 78%, #E64257 100%)',
      }}
    >
      <svg className="absolute inset-0 h-full w-full opacity-[0.08]" aria-hidden="true">
        <defs>
          <pattern id="auth-grid" x="0" y="0" width="26" height="26" patternUnits="userSpaceOnUse">
            <circle cx="3" cy="3" r="1.8" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-grid)" />
      </svg>

      <div className="pointer-events-none absolute -left-28 top-12 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute right-[-100px] top-[-80px] h-80 w-80 rounded-full border border-white/10" />
      <div className="pointer-events-none absolute right-16 top-20 h-28 w-28 rounded-full bg-white/8" />
      <div className="pointer-events-none absolute bottom-[-160px] left-[-60px] h-[420px] w-[420px] rounded-full bg-black/10 blur-2xl" />

      <div className="relative z-10 px-10 pt-12 xl:px-16 xl:pt-16">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 backdrop-blur-md">
          <Sparkles size={14} className="text-white" />
          <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-white/80">
            IELTS Power Experience
          </span>
        </div>

        <div className="max-w-xl">
          <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.35em] text-white/60">
            T&T Academy
          </p>
          <h1
            className="text-white font-black leading-[0.9] tracking-[-0.05em]"
            style={{ fontFamily: "'Montserrat', sans-serif", fontSize: 'clamp(88px, 11vw, 158px)' }}
          >
            BOOM
          </h1>
          <h2
            className="mt-4 max-w-lg text-white text-[34px] font-black leading-tight"
            style={{ fontFamily: "'Montserrat', sans-serif" }}
          >
            High-impact IELTS onboarding with a bold red-white identity.
          </h2>
          <p className="mt-5 max-w-lg text-sm leading-7 text-white/78">
            Enter a premium learning space built for discipline, clarity, and score breakthroughs.
            Every interaction is tuned to feel sharp, luxurious, and confidently academic.
          </p>
        </div>

        <div className="mt-10 grid max-w-2xl grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            ['50K+', 'Learners'],
            ['98%', 'Completion'],
            ['Band 8+', 'Aspirations'],
          ].map(([value, label]) => (
            <div
              key={label}
              className="rounded-3xl border border-white/12 bg-white/10 px-5 py-5 backdrop-blur-xl"
            >
              <p
                className="text-3xl font-black text-white"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                {value}
              </p>
              <p className="mt-2 text-[11px] uppercase tracking-[0.25em] text-white/60">{label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-[10px] relative z-10 grid gap-5 px-10 pb-10 xl:grid-cols-[1.15fr_0.85fr] xl:px-16 xl:pb-16">
        <div className="rounded-[28px] border border-white/14 bg-white/10 p-6 backdrop-blur-2xl">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/65">
              Signature Focus
            </p>
            <Flame size={18} className="text-white/90" />
          </div>
          <p className="mt-4 text-xl font-semibold leading-8 text-white">
            Excellence is not a mood. It is a system practiced every single day.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {['Reading', 'Writing', 'Speaking', 'Listening'].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/16 bg-white/8 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-white/72"
              >
                {item}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[28px] bg-[#fff7f8] p-6 shadow-[0_18px_60px_rgba(74,0,16,0.28)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-voc-red/70">
            What awaits
          </p>
          <div className="mt-5 space-y-4">
            {[
              'A dramatic red-white luxury interface with cleaner focus states',
              'Auth and profile flows wired through the API gateway',
              'Sharper account cues for confidence the moment users enter',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-voc-red/10 p-1.5 text-voc-red">
                  <CheckCircle2 size={14} />
                </div>
                <p className="text-sm leading-6 text-voc-dark">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default function AuthPage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { login, register, isLoading, error, isAuthenticated, clearError } = useAuth()

  const {
    register: loginRegister,
    handleSubmit: handleLoginSubmit,
    formState: { errors: loginErrors },
  } = useForm<LoginFormData>({ resolver: zodResolver(loginSchema) })

  const {
    register: registerFormRegister,
    handleSubmit: handleRegisterSubmit,
    formState: { errors: registerErrors },
  } = useForm<RegisterFormData>({ resolver: zodResolver(registerSchema) })

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/home', { replace: true })
    }
  }, [isAuthenticated, navigate])

  const handleTabChange = (tab: 'login' | 'register') => {
    clearError()
    setActiveTab(tab)
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const submitLogin = (data: LoginFormData) => {
    void login(data)
  }

  const submitRegister = (data: RegisterFormData) => {
    void register({
      email: data.email,
      fullName: data.fullName,
      password: data.password,
    })
  }

  const errorMessage = typeof error === 'string' ? error : null

  return (
    <div
      className="min-h-screen bg-[linear-gradient(180deg,#fff_0%,#fff9fa_100%)] text-voc-dark"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="flex min-h-screen">
        <BrandPanel />

        <section className="relative flex w-full items-center justify-center overflow-hidden px-5 py-8 sm:px-8 lg:w-[44%] lg:px-10">
          <div className="pointer-events-none absolute left-1/2 top-[-120px] h-64 w-64 -translate-x-1/2 rounded-full bg-voc-red/10 blur-3xl" />
          <div className="pointer-events-none absolute bottom-[-140px] right-[-50px] h-72 w-72 rounded-full bg-[#8B0000]/8 blur-3xl" />

          <div className="relative z-10 w-full max-w-[460px]">
            <div className="mb-8 lg:hidden">
              <div className="inline-flex items-center gap-2 rounded-full border border-voc-red/10 bg-voc-red-50 px-3 py-2">
                <Sparkles size={14} className="text-voc-red" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-voc-red">
                  Premium Access
                </span>
              </div>
              <h1
                className="mt-5 text-6xl font-black tracking-[-0.06em] text-voc-red"
                style={{ fontFamily: "'Montserrat', sans-serif" }}
              >
                T&T
              </h1>
              <p className="mt-2 max-w-sm text-sm leading-6 text-voc-gray">
                A luxury IELTS experience with a powerful red-white signature.
              </p>
            </div>

            <div className="rounded-[32px] border border-[#f2d7dc] bg-white/95 p-5 shadow-[0_20px_70px_rgba(197,30,58,0.12)] backdrop-blur-xl sm:p-8">
              <div className="mb-7 flex items-start justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-voc-red/70">
                    {activeTab === 'login' ? 'Member Access' : 'Create Account'}
                  </p>
                  <h2
                    className="mt-2 text-[30px] font-black leading-tight text-voc-dark"
                    style={{ fontFamily: "'Montserrat', sans-serif" }}
                  >
                    {activeTab === 'login' ? 'Welcome back.' : 'Join the red room.'}
                  </h2>
                  <p className="mt-2 max-w-sm text-sm leading-6 text-voc-gray">
                    {activeTab === 'login'
                      ? 'Sign in and continue your IELTS preparation through the gateway-backed platform.'
                      : 'Register now and step into a sharper, high-energy English learning experience.'}
                  </p>
                </div>

                <div className="hidden rounded-2xl bg-[linear-gradient(135deg,#FFF5F5_0%,#fff_100%)] p-3 text-voc-red sm:block">
                  <Sparkles size={20} />
                </div>
              </div>

              <div className="mb-7 grid grid-cols-2 rounded-2xl bg-voc-red-50 p-1.5">
                {(['login', 'register'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => handleTabChange(tab)}
                    className="rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-300"
                    style={{
                      background: activeTab === tab ? 'linear-gradient(135deg, #C51E3A 0%, #8B0000 100%)' : 'transparent',
                      color: activeTab === tab ? '#FFFFFF' : '#6B7280',
                      boxShadow: activeTab === tab ? '0 8px 20px rgba(197,30,58,0.24)' : 'none',
                    }}
                  >
                    {tab === 'login' ? 'Sign In' : 'Register'}
                  </button>
                ))}
              </div>

              {errorMessage && (
                <div className="mb-6 flex items-start gap-3 rounded-2xl border border-voc-red/15 bg-voc-red-50 px-4 py-3.5">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-voc-red" />
                  <p className="text-sm leading-6 text-voc-red">{errorMessage}</p>
                </div>
              )}

              {activeTab === 'login' ? (
                <form onSubmit={handleLoginSubmit(submitLogin)} className="space-y-4" noValidate>
                  <div>
                    <label htmlFor="login-email" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-voc-dark/70">
                      Email
                    </label>
                    <InputField
                      id="login-email"
                      type="email"
                      placeholder="you@example.com"
                      hasError={!!loginErrors.email}
                      leftIcon={<Mail size={16} />}
                      inputProps={{
                        ...loginRegister('email'),
                        autoComplete: 'email',
                      }}
                    />
                    {loginErrors.email && <p className="mt-2 text-xs text-voc-red">{loginErrors.email.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="login-password" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-voc-dark/70">
                      Password
                    </label>
                    <InputField
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      hasError={!!loginErrors.password}
                      leftIcon={<Lock size={16} />}
                      inputProps={{
                        ...loginRegister('password'),
                        autoComplete: 'current-password',
                      }}
                      rightSlot={
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="px-4 text-voc-gray transition-colors hover:text-voc-red"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                    {loginErrors.password && <p className="mt-2 text-xs text-voc-red">{loginErrors.password.message}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold tracking-[0.18em] text-white transition-all duration-300"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      background: isLoading ? '#9CA3AF' : 'linear-gradient(135deg, #C51E3A 0%, #8B0000 100%)',
                      boxShadow: isLoading ? 'none' : '0 16px 34px rgba(197,30,58,0.28)',
                    }}
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <span>SIGN IN</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleRegisterSubmit(submitRegister)} className="space-y-4" noValidate>
                  <div>
                    <label htmlFor="register-name" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-voc-dark/70">
                      Full Name
                    </label>
                    <InputField
                      id="register-name"
                      type="text"
                      placeholder="Nguyen Van A"
                      hasError={!!registerErrors.fullName}
                      leftIcon={<User size={16} />}
                      inputProps={{
                        ...registerFormRegister('fullName'),
                        autoComplete: 'name',
                      }}
                    />
                    {registerErrors.fullName && <p className="mt-2 text-xs text-voc-red">{registerErrors.fullName.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="register-email" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-voc-dark/70">
                      Email
                    </label>
                    <InputField
                      id="register-email"
                      type="email"
                      placeholder="you@example.com"
                      hasError={!!registerErrors.email}
                      leftIcon={<Mail size={16} />}
                      inputProps={{
                        ...registerFormRegister('email'),
                        autoComplete: 'email',
                      }}
                    />
                    {registerErrors.email && <p className="mt-2 text-xs text-voc-red">{registerErrors.email.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="register-password" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-voc-dark/70">
                      Password
                    </label>
                    <InputField
                      id="register-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      hasError={!!registerErrors.password}
                      leftIcon={<Lock size={16} />}
                      inputProps={{
                        ...registerFormRegister('password'),
                        autoComplete: 'new-password',
                      }}
                      rightSlot={
                        <button
                          type="button"
                          onClick={() => setShowPassword((value) => !value)}
                          className="px-4 text-voc-gray transition-colors hover:text-voc-red"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                        >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                    {registerErrors.password && <p className="mt-2 text-xs text-voc-red">{registerErrors.password.message}</p>}
                  </div>

                  <div>
                    <label htmlFor="register-confirm-password" className="mb-2 block text-[11px] font-semibold uppercase tracking-[0.2em] text-voc-dark/70">
                      Confirm Password
                    </label>
                    <InputField
                      id="register-confirm-password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      hasError={!!registerErrors.confirmPassword}
                      leftIcon={<Lock size={16} />}
                      inputProps={{
                        ...registerFormRegister('confirmPassword'),
                        autoComplete: 'new-password',
                      }}
                      rightSlot={
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((value) => !value)}
                          className="px-4 text-voc-gray transition-colors hover:text-voc-red"
                          aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        >
                          {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      }
                    />
                    {registerErrors.confirmPassword && (
                      <p className="mt-2 text-xs text-voc-red">{registerErrors.confirmPassword.message}</p>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-sm font-bold tracking-[0.18em] text-white transition-all duration-300"
                    style={{
                      fontFamily: "'Montserrat', sans-serif",
                      background: isLoading ? '#9CA3AF' : 'linear-gradient(135deg, #C51E3A 0%, #8B0000 100%)',
                      boxShadow: isLoading ? 'none' : '0 16px 34px rgba(197,30,58,0.28)',
                    }}
                  >
                    {isLoading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <span>CREATE ACCOUNT</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              )}

              <div className="mt-7 flex flex-col gap-4 border-t border-[#f4e4e7] pt-6 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-voc-gray">
                  {activeTab === 'login' ? "Don't have an account yet?" : 'Already a member?'}
                  {' '}
                  <button
                    type="button"
                    onClick={() => handleTabChange(activeTab === 'login' ? 'register' : 'login')}
                    className="font-semibold text-voc-red transition-opacity hover:opacity-80"
                  >
                    {activeTab === 'login' ? 'Create one now' : 'Sign in'}
                  </button>
                </p>
                <div className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-voc-gray/70">
                  <CheckCircle2 size={14} className="text-voc-red" />
                  Gateway-connected flow
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
