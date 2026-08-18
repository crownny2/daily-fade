import { type ButtonHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/utils/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'outline'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  isLoading?: boolean
  /** Optional text shown in place of children while isLoading is true. */
  loadingText?: string
}

const variantClasses: Record<Variant, string> = {
  primary: 'bg-ink text-canvas hover:bg-accent-dark',
  secondary: 'bg-accent text-canvas hover:bg-accent-dark',
  outline: 'border border-ink text-ink hover:bg-ink hover:text-canvas',
  ghost: 'text-ink hover:bg-ink/5',
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', isLoading, loadingText, className, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium tracking-wide transition-colors duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}
        {isLoading && loadingText ? loadingText : children}
      </button>
    )
  }
)

Button.displayName = 'Button'
