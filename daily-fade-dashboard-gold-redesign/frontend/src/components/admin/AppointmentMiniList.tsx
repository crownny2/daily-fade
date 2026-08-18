import type { Appointment } from '@/types'
import { formatTime, formatDate } from '@/utils/format'
import { StatusBadge } from './StatusBadge'

interface AppointmentMiniListProps {
  appointments: Appointment[]
  emptyMessage: string
  showDate?: boolean
}

export function AppointmentMiniList({ appointments, emptyMessage, showDate }: AppointmentMiniListProps) {
  if (appointments.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-[var(--admin-text-muted)]">
        {emptyMessage}
      </div>
    )
  }

  return (
    <ul className="divide-y divide-[var(--admin-border)]">
      {appointments.map((appt) => (
        <li key={appt.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[var(--admin-text)]">
              {appt.customer?.name ?? 'Customer'}
              <span className="ml-2 font-mono text-xs font-normal text-[var(--admin-text-subtle)]">
                {appt.booking_reference}
              </span>
            </p>
            <p className="mt-0.5 truncate text-xs text-[var(--admin-text-muted)]">
              {appt.service?.name ?? 'Service'} · {appt.barber?.name ?? 'Barber'}
              {' · '}
              {showDate ? `${formatDate(appt.appointment_date)}, ` : ''}
              {formatTime(appt.start_time)}
            </p>
          </div>
          <StatusBadge status={appt.status} />
        </li>
      ))}
    </ul>
  )
}
