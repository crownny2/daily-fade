import { forwardRef, useId, useState, type InputHTMLAttributes } from 'react'

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: string
  hint?: string
  error?: string
}

/**
 * Built as a standalone field (not a wrapper around <Input>) because the
 * eye-toggle button needs to sit inside the same relative box as the input,
 * and I don't have visibility into <Input>'s internal markup to safely
 * absolutely-position a button on top of it. Styling below mirrors the
 * classes already used around the app (border-line, bg-canvas-raised,
 * text-ink, accent-gold focus ring) — tweak if your <Input> renders
 * something slightly different.
 */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ label, hint, error, id, className = '', ...rest }, ref) {
    const [visible, setVisible] = useState(false)
    const autoId = useId()
    const inputId = id ?? autoId

    return (
      <div className={className}>
        <label htmlFor={inputId} className="mb-1.5 block text-sm text-ink-soft">
          {label}
        </label>
        <div className="relative">
          <input
            ref={ref}
            id={inputId}
            type={visible ? 'text' : 'password'}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            className={`h-13 w-full rounded-xl border bg-canvas-raised px-4 pr-11 text-ink placeholder:text-ink-faint transition-colors duration-200 focus:outline-none focus:ring-[3px] ${
              error
                ? 'border-danger focus:border-danger focus:ring-danger/15'
                : 'border-line focus:border-accent focus:ring-accent/15'
            }`}
            style={{ height: '52px' }}
            {...rest}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            tabIndex={-1}
            aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-faint transition-colors duration-200 hover:text-accent-dark"
          >
            {visible ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="mt-1.5 text-xs text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="mt-1.5 text-xs text-ink-faint">
            {hint}
          </p>
        ) : null}
      </div>
    )
  }
)

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M1.5 12S5 5 12 5s10.5 7 10.5 7-3.5 7-10.5 7S1.5 12 1.5 12Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.24 4.24M9.36 5.14A10.6 10.6 0 0 1 12 5c7 0 10.5 7 10.5 7a13.4 13.4 0 0 1-3.24 4.14M6.5 6.68C3.8 8.4 1.5 12 1.5 12s2.2 4.4 6.02 6.16A10.6 10.6 0 0 0 12 19"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
