import client from './client'
import type {
  AdminAppointmentFilters,
  AdminAppointmentsResponse,
  AdminBarber,
  AdminBarberSchedule,
  AdminCustomerDetail,
  AdminCustomerFilters,
  AdminCustomersResponse,
  AdminDashboardData,
  AdminNotification,
  AdminNotificationFilters,
  AdminNotificationsResponse,
  AdminPaymentFilters,
  AdminPaymentsResponse,
  AdminPayment,
  AdminProfilePayload,
  AdminProfileResult,
  AdminReportFilters,
  AdminReportsData,
  AdminSettings,
  AdminSettingsPayload,
  BarberPayload,
  DayScheduleItem,
  ServicePayload,
  UpdatePaymentStatusPayload,
} from '@/types/admin'
import type { ApiEnvelope, Appointment, AppointmentStatus, Service } from '@/types'

export async function getDashboard() {
  const { data } = await client.get<{ success: boolean; data: AdminDashboardData }>('/admin/dashboard')
  return data.data
}

// --- Appointments (Phase 6B) ---

export async function fetchAdminAppointments(filters: AdminAppointmentFilters = {}) {
  const { data } = await client.get<AdminAppointmentsResponse>('/admin/appointments', {
    params: filters,
  })
  return data
}

export async function updateAppointmentStatus(id: number, status: AppointmentStatus) {
  const { data } = await client.patch<ApiEnvelope<Appointment>>(`/admin/appointments/${id}/status`, {
    status,
  })
  return data.data as Appointment
}

// --- Services (Phase 6C) ---

export async function fetchAdminServices(filters: { search?: string; status?: string } = {}) {
  const { data } = await client.get<ApiEnvelope<Service[]>>('/admin/services', { params: filters })
  return data.data ?? []
}

export async function createService(payload: ServicePayload) {
  const { data } = await client.post<ApiEnvelope<Service>>('/admin/services', payload)
  return data.data as Service
}

export async function updateService(id: number, payload: ServicePayload) {
  const { data } = await client.put<ApiEnvelope<Service>>(`/admin/services/${id}`, payload)
  return data.data as Service
}

export async function toggleServiceStatus(id: number) {
  const { data } = await client.patch<ApiEnvelope<Service>>(`/admin/services/${id}/toggle-status`)
  return data.data as Service
}

/**
 * Deletes when safe. If the service has appointment history, the backend
 * deactivates it instead and returns the updated service in `data`.
 */
export async function deleteService(id: number) {
  const { data } = await client.delete<ApiEnvelope<Service>>(`/admin/services/${id}`)
  return data
}

// --- Barbers (Phase 6D) ---

export async function fetchAdminBarbers(filters: { search?: string; status?: string } = {}) {
  const { data } = await client.get<ApiEnvelope<AdminBarber[]>>('/admin/barbers', { params: filters })
  return data.data ?? []
}

export async function createBarber(payload: BarberPayload) {
  const { data } = await client.post<ApiEnvelope<AdminBarber>>('/admin/barbers', payload)
  return data.data as AdminBarber
}

export async function updateBarber(id: number, payload: BarberPayload) {
  const { data } = await client.put<ApiEnvelope<AdminBarber>>(`/admin/barbers/${id}`, payload)
  return data.data as AdminBarber
}

export async function toggleBarberStatus(id: number) {
  const { data } = await client.patch<ApiEnvelope<AdminBarber>>(`/admin/barbers/${id}/toggle-status`)
  return data.data as AdminBarber
}

// --- Payments (Phase 6F) ---

export async function fetchAdminPayments(filters: AdminPaymentFilters = {}) {
  const { data } = await client.get<AdminPaymentsResponse>('/admin/payments', { params: filters })
  return data
}

export async function fetchAdminPayment(id: number) {
  const { data } = await client.get<ApiEnvelope<AdminPayment>>(`/admin/payments/${id}`)
  return data.data as AdminPayment
}

export async function updatePaymentStatus(id: number, payload: UpdatePaymentStatusPayload) {
  const { data } = await client.patch<ApiEnvelope<AdminPayment>>(`/admin/payments/${id}/status`, payload)
  return data.data as AdminPayment
}

// --- Customers (Phase 6G) ---

export async function fetchAdminCustomers(filters: AdminCustomerFilters = {}) {
  const { data } = await client.get<AdminCustomersResponse>('/admin/customers', { params: filters })
  return data
}

export async function fetchAdminCustomer(id: number) {
  const { data } = await client.get<{ success: boolean; data: AdminCustomerDetail }>(`/admin/customers/${id}`)
  return data.data
}

// --- Reports (Phase 6G) ---

export async function fetchAdminReports(filters: AdminReportFilters = {}) {
  const { data } = await client.get<{ success: boolean; data: AdminReportsData }>('/admin/reports', {
    params: filters,
  })
  return data.data
}

// --- Barber Schedules (Phase 6E) ---

export async function fetchBarberSchedules() {
  const { data } = await client.get<ApiEnvelope<AdminBarberSchedule[]>>('/admin/barber-schedules')
  return data.data ?? []
}

export async function updateBarberSchedule(barberId: number, schedule: DayScheduleItem[]) {
  const { data } = await client.put<ApiEnvelope<AdminBarberSchedule>>(
    `/admin/barber-schedules/${barberId}`,
    { schedule }
  )
  return data.data as AdminBarberSchedule
}

// --- Notifications (Phase 6H) ---

export async function fetchAdminNotifications(filters: AdminNotificationFilters = {}) {
  const { data } = await client.get<AdminNotificationsResponse>('/admin/notifications', {
    params: filters,
  })
  return data
}

export async function fetchAdminNotification(id: number) {
  const { data } = await client.get<ApiEnvelope<AdminNotification>>(`/admin/notifications/${id}`)
  return data.data as AdminNotification
}

export async function markNotificationRead(id: number) {
  const { data } = await client.patch<ApiEnvelope<AdminNotification>>(`/admin/notifications/${id}/read`)
  return data.data as AdminNotification
}

export async function markNotificationUnread(id: number) {
  const { data } = await client.patch<ApiEnvelope<AdminNotification>>(`/admin/notifications/${id}/unread`)
  return data.data as AdminNotification
}

export async function markAllNotificationsRead() {
  const { data } = await client.patch<ApiEnvelope<never>>('/admin/notifications/read-all')
  return data
}

export async function deleteNotification(id: number) {
  const { data } = await client.delete<ApiEnvelope<never>>(`/admin/notifications/${id}`)
  return data
}

// --- Settings (Phase 6I) ---

export async function fetchAdminSettings() {
  const { data } = await client.get<ApiEnvelope<AdminSettings>>('/admin/settings')
  return data.data as AdminSettings
}

export async function updateAdminSettings(payload: AdminSettingsPayload) {
  const { data } = await client.put<ApiEnvelope<AdminSettings>>('/admin/settings', payload)
  return data.data as AdminSettings
}

export async function updateAdminProfile(payload: AdminProfilePayload) {
  const { data } = await client.put<ApiEnvelope<AdminProfileResult>>('/admin/profile', payload)
  return data.data as AdminProfileResult
}
