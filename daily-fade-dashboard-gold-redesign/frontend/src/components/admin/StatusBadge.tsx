import type { AppointmentStatus } from '@/types'
import { statusLabel } from '@/utils/format'
import { cn } from '@/utils/cn'

const toneClasses: Record<AppointmentStatus, string> = {
  pending: 'bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]',
  confirmed: 'bg-[var(--admin-info-soft)] text-[var(--admin-info)]',
  completed: 'bg-[var(--admin-success-soft)] text-[var(--admin-success)]',
  cancelled: 'bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]',
  no_show: 'bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]',
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        toneClasses[status]
      )}
    >
      {statusLabel(status)}
    </span>
  )
}
