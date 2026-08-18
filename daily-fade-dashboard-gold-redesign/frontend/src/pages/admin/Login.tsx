import { useState, type FormEvent } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { Lock, Mail, ShieldAlert } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { extractErrorMessage } from '@/api/client'

export function AdminLogin() {
  const { login, logout, isAuthenticated, role } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Already signed in as an admin — no need to see the login form again.
  if (isAuthenticated && role === 'admin') {
    const from = (location.state as { from?: string } | null)?.from ?? '/admin/dashboard'
    return <Navigate to={from} replace />
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      const loggedInUser = await login({ email, password })

      if (loggedInUser.role !== 'admin') {
        // This account is valid, just not an admin. login() already
        // stored a token and set the session for this non-admin user —
        // tear it back down so the admin login screen never leaves an
        // authenticated Customer/Barber session behind.
        await logout()
        setError('This account does not have admin access.')
        return
      }

      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err, 'Invalid email or password.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      data-theme="dark"
      className="admin-shell flex min-h-screen items-center justify-center bg-[var(--admin-bg)] px-4"
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--admin-accent)] text-lg font-bold text-white">
            SC
          </span>
          <h1 className="mt-4 text-xl font-semibold text-[var(--admin-text)]">Admin Portal</h1>
          <p className="mt-1 text-sm text-[var(--admin-text-muted)]">The Signature Cut — sign in to continue</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6"
          style={{ boxShadow: 'var(--admin-shadow)' }}
        >
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">Email address</span>
              <div className="flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5">
                <Mail className="h-4 w-4 shrink-0 text-[var(--admin-text-subtle)]" />
                <input
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@barbershop.test"
                  className="w-full bg-transparent text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-subtle)]"
                />
              </div>
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">Password</span>
              <div className="flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5">
                <Lock className="h-4 w-4 shrink-0 text-[var(--admin-text-subtle)]" />
                <input
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-subtle)]"
                />
              </div>
            </label>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-[var(--admin-danger-soft)] px-3 py-2.5 text-sm text-[var(--admin-danger)]">
                <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--admin-accent)] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--admin-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting && (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              )}
              Sign in
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-xs text-[var(--admin-text-subtle)]">
          Restricted access. Admin accounts only.
        </p>
      </div>
    </div>
  )
}
