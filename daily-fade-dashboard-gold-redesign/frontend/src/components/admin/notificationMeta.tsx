import {
  CalendarPlus,
  CalendarCheck,
  CalendarX,
  CalendarClock,
  UserX,
  CheckCircle2,
  XCircle,
  Undo2,
  UserPlus,
  Bell,
  CalendarRange,
  type LucideIcon,
} from 'lucide-react'
import type { NotificationType } from '@/types/admin'

interface NotificationMeta {
  icon: LucideIcon
  tone: string
  softTone: string
}

const META: Record<NotificationType, NotificationMeta> = {
  appointment_new: {
    icon: CalendarPlus,
    tone: 'text-[var(--admin-accent)]',
    softTone: 'bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]',
  },
  appointment_confirmed: {
    icon: CalendarCheck,
    tone: 'text-[var(--admin-success)]',
    softTone: 'bg-[var(--admin-success-soft)] text-[var(--admin-success)]',
  },
  appointment_cancelled: {
    icon: CalendarX,
    tone: 'text-[var(--admin-danger)]',
    softTone: 'bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]',
  },
  appointment_completed: {
    icon: CalendarCheck,
    tone: 'text-[var(--admin-success)]',
    softTone: 'bg-[var(--admin-success-soft)] text-[var(--admin-success)]',
  },
  appointment_no_show: {
    icon: UserX,
    tone: 'text-[var(--admin-warning)]',
    softTone: 'bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]',
  },
  payment_pending: {
    icon: CalendarClock,
    tone: 'text-[var(--admin-warning)]',
    softTone: 'bg-[var(--admin-warning-soft)] text-[var(--admin-warning)]',
  },
  payment_paid: {
    icon: CheckCircle2,
    tone: 'text-[var(--admin-success)]',
    softTone: 'bg-[var(--admin-success-soft)] text-[var(--admin-success)]',
  },
  payment_failed: {
    icon: XCircle,
    tone: 'text-[var(--admin-danger)]',
    softTone: 'bg-[var(--admin-danger-soft)] text-[var(--admin-danger)]',
  },
  payment_refunded: {
    icon: Undo2,
    tone: 'text-[var(--admin-info)]',
    softTone: 'bg-[var(--admin-info-soft)] text-[var(--admin-info)]',
  },
  customer_new: {
    icon: UserPlus,
    tone: 'text-[var(--admin-accent)]',
    softTone: 'bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]',
  },
  schedule_updated: {
    icon: CalendarRange,
    tone: 'text-[var(--admin-info)]',
    softTone: 'bg-[var(--admin-info-soft)] text-[var(--admin-info)]',
  },
}

const FALLBACK: NotificationMeta = {
  icon: Bell,
  tone: 'text-[var(--admin-text-muted)]',
  softTone: 'bg-[var(--admin-surface-alt)] text-[var(--admin-text-muted)]',
}

export function notificationMeta(type: NotificationType): NotificationMeta {
  return META[type] ?? FALLBACK
}
