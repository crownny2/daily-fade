import { cn } from '@/utils/cn'

const DOT_TONE: Record<string, string> = {
  success: 'bg-[var(--admin-success)]',
  info: 'bg-[var(--admin-info)]',
  warning: 'bg-[var(--admin-warning)]',
  danger: 'bg-[var(--admin-danger)]',
  muted: 'bg-[var(--admin-text-subtle)]',
}

const TEXT_TONE: Record<string, string> = {
  success: 'text-[var(--admin-success)]',
  info: 'text-[var(--admin-info)]',
  warning: 'text-[var(--admin-warning)]',
  danger: 'text-[var(--admin-danger)]',
  muted: 'text-[var(--admin-text-muted)]',
}

export function DotBadge({
  label,
  tone,
}: {
  label: string
  tone: 'success' | 'info' | 'warning' | 'danger' | 'muted'
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-2.5 py-1 text-xs font-medium',
        TEXT_TONE[tone]
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', DOT_TONE[tone])} />
      {label}
    </span>
  )
}
