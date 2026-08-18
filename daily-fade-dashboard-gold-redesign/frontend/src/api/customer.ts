import client from './client'
import type { ApiEnvelope } from '@/types'
import type {
  CustomerNotification,
  CustomerNotificationFilters,
  CustomerNotificationsResponse,
} from '@/types/customer'

// --- Notifications (Phase 7D-2) ---

export async function fetchCustomerNotifications(filters: CustomerNotificationFilters = {}) {
  const { data } = await client.get<CustomerNotificationsResponse>('/customer/notifications', {
    params: filters,
  })
  return data
}

export async function markCustomerNotificationRead(id: number) {
  const { data } = await client.patch<ApiEnvelope<CustomerNotification>>(`/customer/notifications/${id}/read`)
  return data.data as CustomerNotification
}

export async function markAllCustomerNotificationsRead() {
  const { data } = await client.patch<{ success: boolean; message: string }>('/customer/notifications/read-all')
  return data
}
