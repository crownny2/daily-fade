import client from './client'
import type { ApiEnvelope, Appointment, PaginatedData, PaymentMethod } from '@/types'

export interface CreateAppointmentPayload {
  service_id: number
  barber_id: number
  appointment_date: string
  start_time: string
  notes?: string
  payment_method?: PaymentMethod
}

export async function createAppointment(payload: CreateAppointmentPayload) {
  const { data } = await client.post<ApiEnvelope<Appointment>>('/appointments', payload)
  return data.data as Appointment
}

export async function fetchMyAppointments() {
  const { data } = await client.get<ApiEnvelope<Appointment[]> & PaginatedData<Appointment>>('/my-appointments')
  return (data.data ?? []) as Appointment[]
}

export async function fetchAppointment(id: number | string) {
  const { data } = await client.get<ApiEnvelope<Appointment>>(`/my-appointments/${id}`)
  return data.data as Appointment
}

export async function cancelAppointment(id: number | string) {
  const { data } = await client.patch<ApiEnvelope<Appointment>>(`/my-appointments/${id}/cancel`)
  return data.data as Appointment
}
