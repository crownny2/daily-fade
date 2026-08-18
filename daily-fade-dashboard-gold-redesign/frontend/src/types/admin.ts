import type { Appointment, AppointmentStatus } from './index'

export interface AdminAppointmentFilters {
  search?: string
  status?: AppointmentStatus | ''
  date?: string
  barber_id?: number | ''
  page?: number
}

export interface PaginationMeta {
  current_page: number
  last_page: number
  total: number
  per_page: number
}

export interface AdminAppointmentsResponse {
  success: boolean
  data: Appointment[]
  meta?: PaginationMeta
}

export interface ServicePayload {
  name: string
  description?: string | null
  duration_minutes: number
  price: number
  is_active?: boolean
}

export interface DayScheduleItem {
  day_of_week: number
  day_name: string
  is_available: boolean
  start_time: string
  end_time: string
}

export interface AdminBarberSchedule {
  id: number
  name: string | null
  specialty: string | null
  is_active: boolean
  schedule: DayScheduleItem[]
}

export interface AdminBarber {
  id: number
  name: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  specialty: string | null
  bio: string | null
  is_active: boolean
  status: 'active' | 'inactive'
  appointments_count?: number
  created_at?: string | null
}

export interface BarberPayload {
  first_name: string
  last_name: string
  email: string
  phone: string
  specialty: string
  is_active: boolean
}

export type PaymentMethod = 'cash' | 'gcash' | 'maya'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface AdminPayment {
  id: number
  appointment_id: number
  booking_reference: string | null
  customer: { id: number; name: string } | null
  barber: { id: number; name: string | null } | null
  service: { id: number; name: string } | null
  appointment_date: string | null
  start_time: string | null
  appointment_status: string | null
  amount: string | number
  method: PaymentMethod
  status: PaymentStatus
  transaction_reference: string | null
  paid_at: string | null
  notes: string | null
  created_at?: string
}

export interface AdminPaymentFilters {
  search?: string
  status?: PaymentStatus | ''
  method?: PaymentMethod | ''
  page?: number
}

export interface AdminPaymentsResponse {
  success: boolean
  data: AdminPayment[]
  meta?: PaginationMeta
}

export interface UpdatePaymentStatusPayload {
  status: 'paid' | 'failed' | 'refunded'
  method?: PaymentMethod
  transaction_reference?: string
  notes?: string
}

// --- Customers (Phase 6G) ---

export type CustomerStatus = 'new' | 'active' | 'inactive'

export interface AdminCustomer {
  id: number
  name: string
  email: string
  phone: string | null
  total_appointments: number
  last_appointment: string | null
  total_spent: number
  status: CustomerStatus
  created_at?: string | null
}

export interface CustomerAppointmentHistoryItem {
  id: number
  booking_reference: string | null
  service: string | null
  barber: string | null
  appointment_date: string | null
  start_time: string | null
  price: number
  status: AppointmentStatus
  payment_status: string
}

export interface AdminCustomerDetail extends AdminCustomer {
  appointments: CustomerAppointmentHistoryItem[]
}

export interface AdminCustomerFilters {
  search?: string
  page?: number
}

export interface AdminCustomersResponse {
  success: boolean
  data: AdminCustomer[]
  meta?: PaginationMeta
}

// --- Reports (Phase 6G) ---

export type ReportRange = 'today' | 'week' | 'month' | 'custom'

export interface AdminReportFilters {
  range?: ReportRange
  start_date?: string
  end_date?: string
}

export interface ReportTrendPoint {
  date: string
  revenue?: number
  total?: number
}

export interface ReportTopItem {
  service?: string | null
  barber?: string | null
  bookings: number
}

export interface ReportPaymentBreakdownEntry {
  count: number
  total: number
}

export interface ReportTransaction {
  id: number
  booking_reference: string | null
  customer: string | null
  service: string | null
  amount: number
  method: PaymentMethod
  paid_at: string | null
}

export interface AdminReportsData {
  range: { label: string; start_date: string; end_date: string }
  total_revenue: number
  total_appointments: number
  completed_appointments: number
  confirmed_appointments: number
  pending_appointments: number
  cancelled_appointments: number
  revenue_trend: ReportTrendPoint[]
  appointment_trend: ReportTrendPoint[]
  top_services: ReportTopItem[]
  top_barbers: ReportTopItem[]
  payment_breakdown: Record<PaymentMethod, ReportPaymentBreakdownEntry>
  recent_transactions: ReportTransaction[]
}

// --- Notifications (Phase 6H) ---

export type NotificationType =
  | 'appointment_new'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_completed'
  | 'appointment_no_show'
  | 'payment_pending'
  | 'payment_paid'
  | 'payment_failed'
  | 'payment_refunded'
  | 'customer_new'
  | 'schedule_updated'

export interface AdminNotificationData {
  // Appointment-related
  appointment_id?: number
  booking_reference?: string | null
  customer_id?: number
  customer_name?: string | null
  service_name?: string | null
  barber_name?: string | null
  appointment_date?: string | null
  start_time?: string | null
  status?: string | null
  // Payment-related
  payment_id?: number
  amount?: number
  method?: string | null
  transaction_reference?: string | null
  // Customer-related
  customer_email?: string | null
  registered_at?: string | null
  // Barber-related
  barber_id?: number
}

export interface AdminNotification {
  id: number
  type: NotificationType
  title: string
  message: string
  is_read: boolean
  data: AdminNotificationData
  notifiable_type: 'Appointment' | 'Payment' | 'User' | 'Barber' | null
  notifiable_id: number | null
  created_at: string
}

export interface AdminNotificationFilters {
  is_read?: '0' | '1' | ''
  type?: NotificationType | ''
  page?: number
  per_page?: number
}

export interface AdminNotificationsMeta extends PaginationMeta {
  unread_count: number
}

export interface AdminNotificationsResponse {
  success: boolean
  data: AdminNotification[]
  meta: AdminNotificationsMeta
}

// --- Settings (Phase 6I) ---

export interface BusinessHoursDay {
  day_of_week: number
  day_name: string
  is_open: boolean
  open_time: string
  close_time: string
}

export type DefaultAppointmentStatus = 'pending' | 'confirmed'

export interface AdminSettings {
  business_name: string
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  business_hours: BusinessHoursDay[]
  min_booking_notice_minutes: number
  max_advance_booking_days: number
  online_booking_enabled: boolean
  default_appointment_status: DefaultAppointmentStatus
  payment_cash_enabled: boolean
  payment_gcash_enabled: boolean
  payment_maya_enabled: boolean
  updated_at?: string | null
}

export type AdminSettingsPayload = Omit<AdminSettings, 'updated_at'>

export interface AdminProfilePayload {
  name: string
  email: string
  current_password?: string
  password?: string
  password_confirmation?: string
}

export interface AdminProfileResult {
  id: number
  name: string
  email: string
  role: string
}

export interface AdminDashboardData {
  total_appointments: number
  total_barbers: number
  total_services: number

  today_appointments_count: number
  pending_appointments: number
  confirmed_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  todays_revenue: number

  total_customers: number
  active_barbers: number
  active_services: number

  todays_appointments: Appointment[]
  recent_appointments: Appointment[]
  upcoming_appointments: Appointment[]

  popular_services: { service: string | null; bookings: number }[]
  top_barbers: { barber: string | null; bookings: number; revenue: number }[]

  revenue_trend: { date: string; label: string; revenue: number }[]
  revenue_summary: {
    today: number
    this_week: number
    this_month: number
    pending_payments: number
  }
  recent_activities: {
    id: number
    type: string
    title: string
    message: string
    created_at: string
  }[]
}
