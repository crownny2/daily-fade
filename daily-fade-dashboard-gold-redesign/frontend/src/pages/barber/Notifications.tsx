import { useEffect, useState } from 'react'
import { Bell, CheckCheck, MailOpen, Mail } from 'lucide-react'
import { fetchBarberNotifications, markBarberNotificationRead, markAllBarberNotificationsRead } from '@/api/barber'
import { extractErrorMessage } from '@/api/client'
import { notificationMeta } from '@/components/admin/notificationMeta'
import { timeAgo } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { BarberNotification } from '@/types/barber'

const READ_OPTIONS: { value: '' | '0' | '1'; label: string }[] = [
  { value: '', label: 'All notifications' },
  { value: '0', label: 'Unread only' },
  { value: '1', label: 'Read only' },
]

/**
 * /barber/notifications - reuses the same Notification model/table and
 * Admin\NotificationResource shape as the Admin Notifications page; only
 * the endpoint differs (/barber/notifications, scoped server-side to the
 * authenticated barber's own user_id). Trimmed to what the Phase 7C-2
 * spec actually asks for (list, read/unread, mark all read) - no
 * delete/type-filter/detail-modal, to keep this page small.
 */
export function BarberNotifications() {
  const [isReadFilter, setIsReadFilter] = useState<'' | '0' | '1'>('')
  const [page, setPage] = useState(1)

  const [notifications, setNotifications] = useState<BarberNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [meta, setMeta] = useState<{ current_page: number; last_page: number; total: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMarkingAll, setIsMarkingAll] = useState(false)

  const load = () => {
    setIsLoading(true)
    setError(null)
    fetchBarberNotifications({ is_read: isReadFilter || undefined, page })
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

  const markRead = async (notification: BarberNotification) => {
    if (notification.is_read) return
    try {
      const updated = await markBarberNotificationRead(notification.id)
      setNotifications((current) => current.map((n) => (n.id === updated.id ? updated : n)))
      setUnreadCount((c) => Math.max(0, c - 1))
    } catch (err) {
      // Non-critical — surfaced inline rather than a toast, since it's a small background action.
      setError(extractErrorMessage(err, 'Could not update this notification.'))
    }
  }

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true)
    try {
      await markAllBarberNotificationsRead()
      setNotifications((current) => current.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not mark all as read.'))
    } finally {
      setIsMarkingAll(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">Notifications</h2>
          <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
            {meta ? `${meta.total} total · ${unreadCount} unread` : 'Updates about your appointments and schedule.'}
          </p>
        </div>
        <button
          type="button"
          onClick={handleMarkAllRead}
          disabled={unreadCount === 0 || isMarkingAll}
          className="flex items-center justify-center gap-2 rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-medium text-[var(--admin-text)] hover:bg-[var(--admin-surface-alt)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isMarkingAll ? (
            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
          ) : (
            <CheckCheck className="h-4 w-4" />
          )}
          Mark all as read
        </button>
      </div>

      <div
        className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4"
        style={{ boxShadow: 'var(--admin-shadow)' }}
      >
        <select
          value={isReadFilter}
          onChange={(e) => {
            setIsReadFilter(e.target.value as '' | '0' | '1')
            setPage(1)
          }}
          className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none"
        >
          {READ_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-[var(--admin-danger)]/30 bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]">
          <span>{error}</span>
          <button type="button" onClick={load} className="font-medium underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      <div
        className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]"
        style={{ boxShadow: 'var(--admin-shadow)' }}
      >
        {isLoading && (
          <div className="space-y-2 p-4">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-lg bg-[var(--admin-surface-alt)]" />
            ))}
          </div>
        )}

        {!isLoading && notifications.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
            <Bell className="h-8 w-8 text-[var(--admin-text-subtle)]" />
            <p className="text-sm text-[var(--admin-text-muted)]">
              {isReadFilter ? 'No notifications match this filter.' : 'No notifications yet.'}
            </p>
          </div>
        )}

        {!isLoading &&
          notifications.length > 0 &&
          notifications.map((notification) => {
            const meta = notificationMeta(notification.type)
            const Icon = meta.icon
            return (
              <div
                key={notification.id}
                className={cn(
                  'flex items-start gap-3 border-b border-[var(--admin-border)] px-4 py-3.5 last:border-0',
                  !notification.is_read && 'bg-[var(--admin-accent-soft)]/30'
                )}
              >
                <span className={cn('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', meta.softTone)}>
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-[var(--admin-text)]">{notification.title}</span>
                    {!notification.is_read && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--admin-accent)]" />
                    )}
                    {notification.data.booking_reference && (
                      <span className="rounded-full bg-[var(--admin-surface-alt)] px-2 py-0.5 font-mono text-[10px] text-[var(--admin-text-muted)]">
                        {notification.data.booking_reference}
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-[var(--admin-text-muted)]">{notification.message}</p>
                  <p className="mt-1 text-xs text-[var(--admin-text-subtle)]">{timeAgo(notification.created_at)}</p>
                </div>

                <button
                  type="button"
                  title={notification.is_read ? 'Read' : 'Mark as read'}
                  onClick={() => markRead(notification)}
                  disabled={notification.is_read}
                  className="shrink-0 rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-alt)] hover:text-[var(--admin-text)] disabled:cursor-default disabled:opacity-50"
                >
                  {notification.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                </button>
              </div>
            )
          })}

        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--admin-border)] px-4 py-3">
            <span className="text-xs text-[var(--admin-text-muted)]">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={meta.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-[var(--admin-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--admin-text)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              <button
                type="button"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                className="rounded-lg border border-[var(--admin-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--admin-text)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
