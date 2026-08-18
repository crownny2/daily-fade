import type { ComponentType } from 'react'
import { Construction } from 'lucide-react'

interface AdminPlaceholderProps {
  title: string
  icon?: ComponentType<{ className?: string }>
}

export function AdminPlaceholder({ title, icon: Icon = Construction }: AdminPlaceholderProps) {
  return (
    <div
      className="flex min-h-[60vh] flex-col items-center justify-center rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-6 py-16 text-center"
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
        <Icon className="h-6 w-6" />
      </span>
      <h2 className="mt-4 text-lg font-semibold text-[var(--admin-text)]">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-[var(--admin-text-muted)]">
        This module is coming in a future phase. The route and navigation are already wired up and ready.
      </p>
    </div>
  )
}
