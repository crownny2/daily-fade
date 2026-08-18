import { type SelectHTMLAttributes, forwardRef, useId } from 'react'
import { cn } from '@/utils/cn'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, id, className, children, ...props }, ref) => {
    const generatedId = useId()
    const selectId = id ?? generatedId

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="mb-1.5 block text-sm font-medium text-ink-soft">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full rounded-lg border bg-canvas-raised px-4 py-2.5 text-ink',
            'focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-colors',
            error ? 'border-danger' : 'border-line',
            className
          )}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
