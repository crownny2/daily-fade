import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import {
  fetchCustomerNotifications,
  markCustomerNotificationRead,
  markAllCustomerNotificationsRead,
} from '@/api/customer'
import { extractErrorMessage } from '@/api/client'
import { notificationMeta, notificationTargetPath } from '@/components/customer/notificationMeta'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { timeAgo } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { CustomerNotification } from '@/types/customer'

const READ_OPTIONS: { value: '' | '0' | '1'; label: string }[] = [
  { value: '', label: 'All notifications' },
  { value: '0', label: 'Unread only' },
  { value: '1', label: 'Read only' },
]

/**
 * /notifications — Phase 7D-2. Reuses the same Notification model/table
 * and Admin\NotificationResource shape as the Admin/Barber notification
 * pages; only the endpoint differs (/customer/notifications, scoped
 * server-side to the authenticated customer's own user_id).
 */
export function Notifications() {
  const [isReadFilter, setIsReadFilter] = useState<'' | '0' | '1'>('')
  const [page, setPage] = useState(1)

  const [notifications, setNotifications] = useState<CustomerNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [meta, setMeta] = useState<{ current_page: number; last_page: number; total: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const navigate = useNavigate()

  const load = () => {
    setIsLoading(true)
    setError(null)
    fetchCustomerNotifications({ is_read: isReadFilter || undefined, page })
      .then((res) => {
        setNotifications(res.data ?? [])
        setUnreadCount(res.meta?.unread_count ?? 0)
        setMeta(
          res.meta
            ? { current_page: res.meta.current_page, last_page: res.meta.last_page, total: res.meta.total }
            : null
        )
      })
      .catch((err) => setError(extractErrorMessage(err, 'Could not load notifications.')))
      .finally(() => setIsLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(load, [isReadFilter, page])

  const handleItemClick = async (notification: CustomerNotification) => {
    if (!notification.is_read) {
      try {
        const updated = await markCustomerNotificationRead(notification.id)
        setNotifications((current) => current.map((n) => (n.id === updated.id ? updated : n)))
        setUnreadCount((c) => Math.max(0, c - 1))
      } catch (err) {
        setError(extractErrorMessage(err, 'Could not update this notification.'))
        return
      }
    }

    const target = notificationTargetPath(notification)
    if (target) navigate(target)
  }

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true)
    try {
      await markAllCustomerNotificationsRead()
      setNotifications((current) => current.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not mark all as read.'))
    } finally {
      setIsMarkingAll(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent-dark">Updates</p>
          <h1 className="mt-2 font-display text-4xl text-ink">Notifications</h1>
          <p className="mt-2 text-sm text-ink-soft">
            {meta ? `${meta.total} total · ${unreadCount} unread` : 'Updates about your bookings and payments.'}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || isMarkingAll}
          isLoading={isMarkingAll}
          className="self-start sm:self-auto"
        >
          <CheckCheck className="h-4 w-4" />
          Mark all as read
        </Button>
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <select
          value={isReadFilter}
          onChange={(e) => {
            setIsReadFilter(e.target.value as '' | '0' | '1')
            setPage(1)
          }}
          className="border border-line bg-canvas-raised px-3 py-2 text-sm text-ink outline-none"
        >
          {READ_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4">
        {isLoading && <LoadingSpinner label="Loading notifications…" />}
        {error && <ErrorMessage message={error} onRetry={load} />}

        {!isLoading && !error && notifications.length === 0 && (
          <EmptyState
            title="No notifications yet"
            description={
              isReadFilter
                ? 'No notifications match this filter.'
                : 'Updates about your bookings and payments will show up here.'
            }
            action={<Bell className="h-5 w-5 text-ink-faint" />}
          />
        )}

        {!isLoading && !error && notifications.length > 0 && (
          <div className="flex flex-col gap-3">
            {notifications.map((notification) => {
              const meta = notificationMeta(notification.type)
              const Icon = meta.icon
              return (
                <Card
                  key={notification.id}
                  onClick={() => handleItemClick(notification)}
                  className={cn(
                    'flex cursor-pointer items-start gap-3 p-4 hover:border-ink/40',
                    !notification.is_read && 'border-accent/40 bg-accent-soft/20'
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                      meta.softTone
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-ink">{notification.title}</span>
                      {!notification.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                      {notification.data.booking_reference && (
                        <span className="rounded-full bg-ink/5 px-2 py-0.5 font-mono text-[10px] text-ink-faint">
                          {notification.data.booking_reference}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-sm text-ink-soft">{notification.message}</p>
                    <p className="mt-1 text-xs text-ink-faint">{timeAgo(notification.created_at)}</p>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {meta && meta.last_page > 1 && (
          <div className="mt-6 flex items-center justify-between border-t border-line pt-4">
            <span className="text-xs text-ink-faint">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
