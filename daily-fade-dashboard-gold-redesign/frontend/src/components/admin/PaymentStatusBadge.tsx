import type { PaymentStatus } from '@/types/admin'
import { statusLabel } from '@/utils/format'
import { cn } from '@/utils/cn'

const toneClasses: Record<PaymentStatus, string> = {
  pending: 'bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]',
  paid: 'bg-[var(--admin-success-soft)] text-[var(--admin-success)]',
  failed: 'bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]',
  refunded: 'bg-[var(--admin-info-soft)] text-[var(--admin-info)]',
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
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
