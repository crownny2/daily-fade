import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/brand/Logo'

export function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    // NOTE: no /auth/forgot-password endpoint exists on the backend yet.
    // This is UI-only for now; wire this up once that route is added.
    setSubmitted(true)
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <div className="mb-2 flex justify-center">
        <Logo size={52} />
      </div>
      <p className="text-center font-mono text-xs uppercase tracking-widest text-accent-dark">Account recovery</p>
      <h1 className="mt-2 text-center font-display text-3xl text-ink">Reset your password</h1>

      {submitted ? (
        <div className="mt-8 border border-line bg-canvas-raised p-5">
          <p className="text-sm text-ink-soft">
            If an account exists for <span className="font-medium text-ink">{email}</span>, you'll receive
            password reset instructions shortly.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
          <p className="text-sm text-ink-soft">
            Enter the email address associated with your account and we'll send you a link to reset your
            password.
          </p>
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" className="w-full">
            Send Reset Link
          </Button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-ink-soft">
        Remembered it after all?{' '}
        <Link to="/login" className="text-accent-dark hover:underline">
          Back to sign in
        </Link>
      </p>
    </div>
  )
}
