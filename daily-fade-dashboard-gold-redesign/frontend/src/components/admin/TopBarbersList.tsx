import { formatCurrency } from '@/utils/format'
import { cn } from '@/utils/cn'

interface TopBarbersListProps {
  barbers: { barber: string | null; bookings: number; revenue: number }[]
  emptyMessage?: string
}

/** Ranked barber leaderboard for the dashboard — avatar initial, name, bookings, revenue. */
export function TopBarbersList({ barbers, emptyMessage = 'No bookings yet.' }: TopBarbersListProps) {
  if (barbers.length === 0) {
    return <p className="py-6 text-center text-sm text-[var(--admin-text-muted)]">{emptyMessage}</p>
  }

  return (
    <ul className="space-y-3">
      {barbers.map((b, i) => {
        const rank = i + 1
        const name = b.barber ?? 'Unknown'
        return (
          <li key={`${name}-${i}`} className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
                rank === 1
                  ? 'bg-[var(--admin-accent)] text-black'
                  : 'bg-[var(--admin-surface-alt)] text-[var(--admin-text-muted)]'
              )}
            >
              {rank}
            </span>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--admin-accent-soft)] text-xs font-semibold text-[var(--admin-accent)]">
              {name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-[var(--admin-text)]">{name}</p>
              <p className="text-xs text-[var(--admin-text-muted)]">{b.bookings} appointments</p>
            </div>
            <span className="shrink-0 text-sm font-semibold text-[var(--admin-text)]">
              {formatCurrency(b.revenue)}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
