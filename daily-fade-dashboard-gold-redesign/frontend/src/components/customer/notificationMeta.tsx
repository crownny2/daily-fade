import {
  CalendarPlus,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  UserX,
  CheckCircle2,
  XCircle,
  Undo2,
  Bell,
  type LucideIcon,
} from 'lucide-react'
import type { NotificationType } from '@/types/admin'

interface NotificationMeta {
  icon: LucideIcon
  softTone: string
}

// Phase 7D-2: customer-facing equivalent of components/admin/notificationMeta.tsx,
// styled with the customer site's own design tokens (accent/success/danger)
// instead of the admin panel's --admin-* CSS variables.
const META: Partial<Record<NotificationType, NotificationMeta>> = {
  appointment_new: { icon: CalendarPlus, softTone: 'bg-accent/10 text-accent-dark' },
  appointment_confirmed: { icon: CalendarCheck, softTone: 'bg-success/10 text-success' },
  appointment_cancelled: { icon: CalendarX, softTone: 'bg-danger/10 text-danger' },
  appointment_completed: { icon: CalendarCheck, softTone: 'bg-success/10 text-success' },
  appointment_no_show: { icon: UserX, softTone: 'bg-danger/10 text-danger' },
  payment_pending: { icon: CalendarClock, softTone: 'bg-accent/10 text-accent-dark' },
  payment_paid: { icon: CheckCircle2, softTone: 'bg-success/10 text-success' },
  payment_failed: { icon: XCircle, softTone: 'bg-danger/10 text-danger' },
  payment_refunded: { icon: Undo2, softTone: 'bg-accent/10 text-accent-dark' },
}

const FALLBACK: NotificationMeta = { icon: Bell, softTone: 'bg-ink/5 text-ink-soft' }

export function notificationMeta(type: NotificationType): NotificationMeta {
  return META[type] ?? FALLBACK
}

/** Where clicking this notification should take the customer. */
export function notificationTargetPath(notification: { notifiable_type: string | null; data: { appointment_id?: number } }): string | null {
  if (!notification.notifiable_type) return null
  if (notification.notifiable_type === 'Appointment' || notification.notifiable_type === 'Payment') {
    return notification.data.appointment_id ? `/my-appointments/${notification.data.appointment_id}` : null
  }
  return null
}
