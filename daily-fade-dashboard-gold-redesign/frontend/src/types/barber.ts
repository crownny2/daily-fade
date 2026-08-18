import type { Appointment, AppointmentStatus } from '@/types'
import type { AdminNotification, AdminNotificationsMeta, NotificationType, PaginationMeta } from '@/types/admin'

export interface BarberDashboardData {
  today_appointments_count: number
  upcoming_appointments_count: number
  pending_appointments: number
  confirmed_appointments: number
  completed_appointments: number
  todays_appointments: Appointment[]
  upcoming_appointments: Appointment[]
}

export interface BarberAppointmentFilters {
  search?: string
  status?: AppointmentStatus | ''
  date?: string
  page?: number
}

export interface BarberAppointmentsResponse {
  success: boolean
  data: Appointment[]
  meta?: PaginationMeta
}

export interface BarberScheduleDay {
  day_of_week: number
  day_name: string
  is_available: boolean
  start_time: string
  end_time: string
}

export interface BarberScheduleData {
  barber_id: number
  schedule: BarberScheduleDay[]
}

export interface BarberProfile {
  id: number
  name: string
  first_name: string
  last_name: string
  email: string
  phone: string | null
  specialty: string | null
  bio: string | null
  is_active: boolean
  status: 'active' | 'inactive'
  created_at: string | null
}

export interface BarberProfilePayload {
  name: string
  email: string
  phone?: string | null
  specialty?: string | null
  bio?: string | null
  current_password?: string
  password?: string
  password_confirmation?: string
}

// Notification model is user-scoped, not role-scoped — same shape as the
// Admin notification types, just reused for the barber's own inbox.
export type BarberNotification = AdminNotification
export type BarberNotificationType = NotificationType

export interface BarberNotificationFilters {
  is_read?: '0' | '1' | ''
  type?: NotificationType | ''
  page?: number
  per_page?: number
}

export interface BarberNotificationsMeta extends AdminNotificationsMeta {}

export interface BarberNotificationsResponse {
  success: boolean
  data: BarberNotification[]
  meta: BarberNotificationsMeta
}
