import { type InputHTMLAttributes, type ReactNode, forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  /** Optional icon rendered inside the field, left-aligned (e.g. <Mail className="h-4 w-4" />). */
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, icon, ...props }, ref) => {
    const generatedId = useId()
    const inputId = id ?? generatedId

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-ink-soft">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-faint"
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-lg border bg-canvas-raised px-4 py-2.5 text-ink placeholder:text-ink-faint',
              'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors',
              Boolean(icon) && 'pl-10',
              error ? 'border-danger' : 'border-line',
              className
            )}
            aria-invalid={Boolean(error)}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-danger">{error}</p>
        ) : hint ? (
          <p className="mt-1.5 text-xs text-ink-faint">{hint}</p>
        ) : null}
      </div>
    )
  }
)

Input.displayName = 'Input'
