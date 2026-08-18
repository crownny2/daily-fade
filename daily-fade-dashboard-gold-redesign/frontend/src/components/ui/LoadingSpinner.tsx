import { cn } from '@/utils/cn'

interface LoadingSpinnerProps {
  label?: string
  className?: string
}

export function LoadingSpinner({ label = 'Loading…', className }: LoadingSpinnerProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-ink-faint', className)}>
      <span className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      <p className="font-mono text-xs uppercase tracking-widest">{label}</p>
    </div>
  )
}
