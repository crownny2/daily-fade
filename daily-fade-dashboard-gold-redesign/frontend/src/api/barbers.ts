import client from './client'
import type { ApiEnvelope, Availability, Barber } from '@/types'

export async function fetchBarbers() {
  const { data } = await client.get<ApiEnvelope<Barber[]>>('/barbers')
  return data.data ?? []
}

export async function fetchAvailability(barberId: number, date: string, serviceId: number) {
  const { data } = await client.get<ApiEnvelope<Availability>>(`/barbers/${barberId}/availability`, {
    params: { date, service_id: serviceId },
  })
  return data.data as Availability
}
