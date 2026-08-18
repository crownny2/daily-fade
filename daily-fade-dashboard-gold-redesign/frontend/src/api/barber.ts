import client from './client'
import type { ApiEnvelope, Appointment, AppointmentStatus } from '@/types'
import type {
  BarberAppointmentFilters,
  BarberAppointmentsResponse,
  BarberDashboardData,
  BarberNotification,
  BarberNotificationFilters,
  BarberNotificationsResponse,
  BarberProfile,
  BarberProfilePayload,
  BarberScheduleData,
} from '@/types/barber'

export async function getBarberDashboard() {
  const { data } = await client.get<ApiEnvelope<BarberDashboardData>>('/barber/dashboard')
  return data.data as BarberDashboardData
}

export async function fetchBarberAppointments(filters: BarberAppointmentFilters = {}) {
  const { data } = await client.get<BarberAppointmentsResponse>('/barber/appointments', {
    params: filters,
  })
  return data
}

export async function fetchBarberAppointment(id: number) {
  const { data } = await client.get<ApiEnvelope<Appointment>>(`/barber/appointments/${id}`)
  return data.data as Appointment
}

export async function updateBarberAppointmentStatus(id: number, status: AppointmentStatus) {
  const { data } = await client.patch<ApiEnvelope<Appointment>>(`/barber/appointments/${id}/status`, {
    status,
  })
  return data.data as Appointment
}

// --- Schedule (Phase 7C-2) ---

export async function fetchBarberSchedule() {
  const { data } = await client.get<ApiEnvelope<BarberScheduleData>>('/barber/schedule')
  return data.data as BarberScheduleData
}

// --- Profile (Phase 7C-2) ---

export async function fetchBarberProfile() {
  const { data } = await client.get<ApiEnvelope<BarberProfile>>('/barber/profile')
  return data.data as BarberProfile
}

export async function updateBarberProfile(payload: BarberProfilePayload) {
  const { data } = await client.put<ApiEnvelope<BarberProfile>>('/barber/profile', payload)
  return data.data as BarberProfile
}

// --- Notifications (Phase 7C-2) ---

export async function fetchBarberNotifications(filters: BarberNotificationFilters = {}) {
  const { data } = await client.get<BarberNotificationsResponse>('/barber/notifications', {
    params: filters,
  })
  return data
}

export async function markBarberNotificationRead(id: number) {
  const { data } = await client.patch<ApiEnvelope<BarberNotification>>(`/barber/notifications/${id}/read`)
  return data.data as BarberNotification
}

export async function markAllBarberNotificationsRead() {
  const { data } = await client.patch<{ success: boolean; message: string }>('/barber/notifications/read-all')
  return data
}
