import type { ComponentType } from 'react'
import { cn } from '@/utils/cn'

type Tone = 'default' | 'accent' | 'success' | 'warning' | 'danger' | 'info'

const toneClasses: Record<Tone, string> = {
  default: 'bg-[var(--admin-surface-alt)] text-[var(--admin-text-muted)]',
  accent: 'bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]',
  success: 'bg-[var(--admin-success-soft)] text-[var(--admin-success)]',
  warning: 'bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]',
  danger: 'bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]',
  info: 'bg-[var(--admin-info-soft)] text-[var(--admin-info)]',
}

interface StatCardProps {
  label: string
  value: string | number
  icon: ComponentType<{ className?: string }>
  tone?: Tone
  isLoading?: boolean
}

export function StatCard({ label, value, icon: Icon, tone = 'default', isLoading }: StatCardProps) {
  return (
    <div
      className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5"
      style={{ boxShadow: 'var(--admin-shadow)' }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--admin-text-muted)]">{label}</p>
          {isLoading ? (
            <div className="mt-2 h-7 w-16 animate-pulse rounded bg-[var(--admin-surface-alt)]" />
          ) : (
            <p className="mt-1 text-2xl font-semibold text-[var(--admin-text)]">{value}</p>
          )}
        </div>
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', toneClasses[tone])}>
          <Icon className="h-5 w-5" />
        </span>
      </div>
    </div>
  )
}
