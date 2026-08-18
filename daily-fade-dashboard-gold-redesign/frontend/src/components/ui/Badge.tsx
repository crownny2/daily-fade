import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Tone = 'neutral' | 'success' | 'danger' | 'accent'

const toneClasses: Record<Tone, string> = {
  neutral: 'bg-ink/5 text-ink-soft',
  success: 'bg-success/10 text-success',
  danger: 'bg-danger/10 text-danger',
  accent: 'bg-accent/10 text-accent-dark',
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-3 py-1 text-xs font-mono uppercase tracking-wide',
        toneClasses[tone]
      )}
    >
      {children}
    </span>
  )
}
