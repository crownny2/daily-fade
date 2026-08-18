interface TopListProps {
  items: { label: string; value: number }[]
  emptyMessage?: string
}

/** Ranked horizontal bar list, used for top services / top barbers. */
export function TopList({ items, emptyMessage = 'No data for this range.' }: TopListProps) {
  if (items.length === 0) {
    return <p className="py-6 text-center text-sm text-[var(--admin-text-muted)]">{emptyMessage}</p>
  }

  const max = Math.max(...items.map((i) => i.value), 1)

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="truncate text-[var(--admin-text)]">{item.label}</span>
            <span className="shrink-0 text-[var(--admin-text-muted)]">{item.value}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--admin-surface-alt)]">
            <div
              className="h-full rounded-full bg-[var(--admin-accent)]"
              style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
