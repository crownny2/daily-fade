import type { AppointmentStatus } from '@/types'

export function statusTone(status: AppointmentStatus): 'success' | 'danger' | 'accent' | 'neutral' {
  switch (status) {
    case 'confirmed':
    case 'completed':
      return 'success'
    case 'cancelled':
    case 'no_show':
      return 'danger'
    case 'pending':
      return 'accent'
    default:
      return 'neutral'
  }
}

/** Same tone mapping, for the separate Payment status (pending/paid/failed/refunded). */
export function paymentStatusTone(status: string): 'success' | 'danger' | 'accent' | 'neutral' {
  switch (status) {
    case 'paid':
      return 'success'
    case 'failed':
      return 'danger'
    case 'pending':
      return 'accent'
    default:
      return 'neutral'
  }
}
