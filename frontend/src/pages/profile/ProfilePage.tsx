import MainLayout from '../../layouts/MainLayout'
import { useAuth } from '../../hooks/useAuth'

export default function ProfilePage() {
  const { user, isLoading } = useAuth()

  return (
    <MainLayout
      eyebrow="Profile"
      title="Your profile"
      description="Manage your account details"
    >
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <div className="rounded-[20px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6 flex flex-col items-center gap-4">
          {isLoading || !user ? (
            <div className="h-24 w-24 rounded-full bg-[var(--voc-surface-strong)]" />
          ) : (
            <div className="flex flex-col items-center gap-3">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-pink-600 to-rose-400 flex items-center justify-center text-white text-2xl font-bold">
                {user.fullName ? user.fullName.split(' ').map(s=>s[0]).slice(0,2).join('') : user.email?.[0]?.toUpperCase()}
              </div>
              <p className="text-sm text-[var(--voc-text-soft)]">{user.fullName}</p>
            </div>
          )}
          <button type="button" className="mt-2 rounded-2xl border border-[var(--voc-border)] bg-[var(--voc-panel-muted)] px-3 py-2 text-sm font-semibold">Change avatar</button>
        </div>

        <div className="rounded-[20px] border border-[var(--voc-border)] bg-[var(--voc-panel)] p-6">
          {isLoading || !user ? (
            <p className="text-sm text-[var(--voc-text-soft)]">Loading profile...</p>
          ) : (
            <div>
              <p className="text-sm text-[var(--voc-text-soft)]">Full name</p>
              <h2 className="mt-2 text-xl font-bold">{user.fullName}</h2>

              <p className="mt-4 text-sm text-[var(--voc-text-soft)]">Email</p>
              <p className="mt-2 text-sm">{user.email}</p>

              <p className="mt-6 text-sm text-[var(--voc-text-soft)]">Role</p>
              <p className="mt-2 text-sm">{Array.isArray(user.roles) ? user.roles.join(', ') : 'User'}</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  )
}
