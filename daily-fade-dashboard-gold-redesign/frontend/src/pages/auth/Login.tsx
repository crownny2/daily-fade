import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { extractErrorMessage } from '@/api/client'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { PasswordInput } from '@/components/auth/PasswordInput'

interface LoginLocationState {
  from?: string
  email?: string
  justRegistered?: boolean
}

export function Login() {
  const { login } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const location = useLocation()
  const locationState = location.state as LoginLocationState | null

  const [email, setEmail] = useState(locationState?.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shake, setShake] = useState(false)
  const passwordRef = useRef<HTMLInputElement>(null)

  const from = locationState?.from ?? '/my-appointments'
  const justRegistered = locationState?.justRegistered ?? false

  // Arriving fresh from Create Account: email is already filled in, so send
  // focus straight to the password field.
  useEffect(() => {
    if (justRegistered) {
      passwordRef.current?.focus()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)
    try {
      const loggedInUser = await login({ email, password })
      showToast('Welcome back!', 'success')

      if (loggedInUser.role === 'admin') {
        navigate('/admin', { replace: true })
      } else if (loggedInUser.role === 'barber') {
        navigate('/barber', { replace: true })
      } else {
        navigate(from, { replace: true })
      }
    } catch (err) {
      setError(extractErrorMessage(err, 'Invalid email or password.'))
      setShake(true)
      setTimeout(() => setShake(false), 350)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthSplitLayout>
      <div
        className={`daily-fade-auth mt-8 rounded-2xl border border-line bg-canvas-raised p-8 shadow-card animate-fade-up ${shake ? 'animate-shake' : ''}`}
        style={{ animationDelay: '0.1s' }}
      >
        <p className="font-mono text-xs uppercase tracking-widest text-accent-dark">
          {justRegistered ? 'Account created' : 'Welcome back'}
        </p>
        <h1 className="mt-2 font-display text-3xl text-ink">
          {justRegistered ? 'Sign in to continue' : 'Log in to your account'}
        </h1>
        <p className="mt-2 text-sm text-ink-soft">
          {justRegistered
            ? 'Your account is ready. Enter the password you just chose to log in.'
            : 'Welcome back to Daily Fade. Your next great look starts here.'}
        </p>

        {/* Thin gold divider, a nod to the physical shop rather than decoration for its own sake */}
        <div className="mt-5 flex items-center gap-3 text-accent" aria-hidden="true">
          <span className="h-px flex-1 bg-line" />
          <ScissorsIcon />
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <div className="animate-fade-up" style={{ animationDelay: '0.16s' }}>
            <Input
              label="Email"
              type="email"
              autoComplete="email"
              icon={<Mail className="h-4 w-4" strokeWidth={1.75} />}
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="animate-fade-up" style={{ animationDelay: '0.22s' }}>
            <PasswordInput
              ref={passwordRef}
              label="Password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div
            className="flex items-center justify-between text-sm animate-fade-up"
            style={{ animationDelay: '0.28s' }}
          >
            <label className="flex cursor-pointer items-center gap-2 text-ink-soft">
              <input type="checkbox" defaultChecked className="h-3.5 w-3.5 accent-accent" />
              Remember me
            </label>
            <Link
              to="/forgot-password"
              className="font-medium text-accent-dark transition-colors duration-200 hover:text-accent"
            >
              Forgot password?
            </Link>
          </div>

          <div className="animate-fade-up" style={{ animationDelay: '0.34s' }}>
            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingText="Logging in..."
              className="w-full transition-transform duration-200 hover:scale-[1.02] active:scale-[0.98]"
            >
              Log In
            </Button>
          </div>
        </form>
      </div>

      <p
        className="mt-8 text-center text-sm text-ink-soft animate-fade-up"
        style={{ animationDelay: '0.4s' }}
      >
        Don't have an account?{' '}
        <Link
          to="/register"
          viewTransition
          className="font-medium text-accent-dark transition-colors duration-200 hover:underline"
        >
          Create Account
        </Link>
      </p>
    </AuthSplitLayout>
  )
}

function ScissorsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="6" cy="18" r="2.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 7.5 20 18M8 16.5 20 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}