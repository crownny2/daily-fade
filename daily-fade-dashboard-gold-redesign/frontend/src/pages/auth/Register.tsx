import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { extractErrorMessage } from '@/api/client'
import { AuthSplitLayout } from '@/components/auth/AuthSplitLayout'
import { PasswordInput } from '@/components/auth/PasswordInput'

export function Register() {
  const { register } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [shake, setShake] = useState(false)

  const update = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (form.password !== form.password_confirmation) {
      setError('Passwords do not match.')
      setShake(true)
      setTimeout(() => setShake(false), 400)
      return
    }
    setIsSubmitting(true)
    try {
      await register(form)
      showToast('Account created! Please sign in.', 'success')
      navigate('/login', { replace: true, state: { email: form.email, justRegistered: true } })
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not create your account.'))
      setShake(true)
      setTimeout(() => setShake(false), 400)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthSplitLayout>
      {/* Self-contained styles — same pattern as Login.tsx / AuthSplitLayout.tsx */}
      <style>{`
        .daily-fade-auth .df-rise {
          animation: df-card-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes df-card-rise {
          from { opacity: 0; transform: translateY(40px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .daily-fade-auth .df-field {
          animation: df-field-in 0.55s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        @keyframes df-field-in {
          from { opacity: 0; transform: translateX(-16px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .daily-fade-auth .df-shake {
          animation: df-shake 0.4s cubic-bezier(0.36, 0.07, 0.19, 0.97) both;
        }
        @keyframes df-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }
        .daily-fade-auth .df-card {
          position: relative;
          transition: box-shadow 0.4s ease, border-color 0.4s ease, transform 0.4s ease;
        }
        .daily-fade-auth .df-card:hover,
        .daily-fade-auth .df-card:focus-within {
          border-color: var(--color-accent, #b3873c);
          box-shadow: var(--shadow-gold, 0 16px 40px -16px rgba(201,163,78,0.35));
          transform: translateY(-2px);
        }
        .daily-fade-auth .df-btn {
          position: relative;
          overflow: hidden;
          transition: transform 0.2s ease;
        }
        .daily-fade-auth .df-btn:hover { transform: scale(1.02); }
        .daily-fade-auth .df-btn:active { transform: scale(0.98); }
        .daily-fade-auth .df-btn::after {
          content: '';
          position: absolute;
          top: 0;
          left: -75%;
          width: 50%;
          height: 100%;
          background: linear-gradient(120deg, transparent, rgba(255,255,255,0.35), transparent);
          transform: skewX(-20deg);
          transition: left 0.6s ease;
        }
        .daily-fade-auth .df-btn:hover::after { left: 125%; }
        .daily-fade-auth .df-link { transition: color 0.2s ease; }
      `}</style>

      <div
        className={`daily-fade-auth df-card df-rise relative mt-8 rounded-2xl border border-line bg-canvas-raised p-8 shadow-card ${shake ? 'df-shake' : ''}`}
        style={{ animationDelay: '0.12s' }}
      >
        <p className="font-mono text-xs uppercase tracking-widest text-accent-dark">Join us</p>
        <h1 className="mt-2 font-display text-3xl text-ink">Create your account</h1>
        <p className="mt-2 text-sm text-ink-soft">Be part of the Daily Fade community.</p>

        <div className="mt-5 flex items-center gap-3 text-accent" aria-hidden="true">
          <span className="h-px flex-1 bg-line" />
          <ScissorsIcon />
          <span className="h-px flex-1 bg-line" />
        </div>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-5">
          <div className="df-field" style={{ animationDelay: '0.22s' }}>
            <Input label="Full name" value={form.name} onChange={update('name')} required />
          </div>
          <div className="df-field" style={{ animationDelay: '0.28s' }}>
            <Input
              label="Email address"
              type="email"
              autoComplete="email"
              icon={<Mail className="h-4 w-4" strokeWidth={1.75} />}
              placeholder="Enter your email"
              value={form.email}
              onChange={update('email')}
              required
            />
          </div>
          <div className="df-field" style={{ animationDelay: '0.34s' }}>
            <Input label="Phone (optional)" type="tel" value={form.phone} onChange={update('phone')} />
          </div>
          <div className="df-field" style={{ animationDelay: '0.4s' }}>
            <PasswordInput
              label="Password"
              autoComplete="new-password"
              value={form.password}
              onChange={update('password')}
              hint="At least 8 characters, with a mix of letters and numbers."
              required
            />
          </div>
          <div className="df-field" style={{ animationDelay: '0.46s' }}>
            <PasswordInput
              label="Confirm password"
              autoComplete="new-password"
              value={form.password_confirmation}
              onChange={update('password_confirmation')}
              required
            />
          </div>
          {error && <p className="df-field text-sm text-danger">{error}</p>}
          <div className="df-field" style={{ animationDelay: '0.52s' }}>
            <Button
              type="submit"
              isLoading={isSubmitting}
              loadingText="Creating account..."
              className="df-btn w-full"
            >
              Create Account
            </Button>
          </div>
        </form>
      </div>

      <p className="df-field relative mt-8 text-center text-sm text-ink-soft" style={{ animationDelay: '0.6s' }}>
        Already have an account?{' '}
        <Link to="/login" viewTransition className="df-link font-medium text-accent-dark hover:underline">
          Login
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
