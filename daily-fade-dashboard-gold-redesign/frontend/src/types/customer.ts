import type { AdminNotification, AdminNotificationsMeta, NotificationType } from './admin'

// Phase 7D-2: Customer notifications. Reuses the same Notification
// model/table and Admin\NotificationResource shape as Admin and Barber -
// only the endpoint differs (/customer/notifications, scoped server-side
// to the authenticated customer's own user_id).
export type CustomerNotification = AdminNotification
export type CustomerNotificationType = NotificationType

export interface CustomerNotificationFilters {
  is_read?: '0' | '1' | ''
  type?: NotificationType | ''
  page?: number
  per_page?: number
}

export interface CustomerNotificationsMeta extends AdminNotificationsMeta {}

export interface CustomerNotificationsResponse {
  success: boolean
  data: CustomerNotification[]
  meta: CustomerNotificationsMeta
}
