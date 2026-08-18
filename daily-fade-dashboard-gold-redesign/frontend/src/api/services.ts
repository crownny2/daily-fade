import client from './client'
import type { ApiEnvelope, Service } from '@/types'

export async function fetchServices() {
  const { data } = await client.get<ApiEnvelope<Service[]>>('/services')
  return data.data ?? []
}
