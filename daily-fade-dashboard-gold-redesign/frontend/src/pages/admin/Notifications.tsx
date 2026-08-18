import { useEffect, useState } from 'react'
import { Bell, CheckCheck, Trash2, MailOpen, Mail } from 'lucide-react'
import {
  fetchAdminNotifications,
  markNotificationRead,
  markNotificationUnread,
  markAllNotificationsRead,
  deleteNotification,
} from '@/api/admin'
import { extractErrorMessage } from '@/api/client'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/admin/Modal'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { notificationMeta } from '@/components/admin/notificationMeta'
import { formatCurrency, formatDate, formatTime, timeAgo } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { AdminNotification, NotificationType } from '@/types/admin'

const READ_OPTIONS: { value: '' | '0' | '1'; label: string }[] = [
  { value: '', label: 'All notifications' },
  { value: '0', label: 'Unread only' },
  { value: '1', label: 'Read only' },
]

const TYPE_OPTIONS: { value: NotificationType | ''; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'appointment_new', label: 'New Appointment' },
  { value: 'appointment_confirmed', label: 'Appointment Confirmed' },
  { value: 'appointment_cancelled', label: 'Appointment Cancelled' },
  { value: 'appointment_completed', label: 'Appointment Completed' },
  { value: 'appointment_no_show', label: 'Appointment No-Show' },
  { value: 'payment_paid', label: 'Payment Received' },
  { value: 'payment_failed', label: 'Payment Failed' },
  { value: 'payment_refunded', label: 'Payment Refunded' },
  { value: 'customer_new', label: 'New Customer' },
]

export function AdminNotifications() {
  const { showToast } = useToast()

  const [isReadFilter, setIsReadFilter] = useState<'' | '0' | '1'>('')
  const [typeFilter, setTypeFilter] = useState<NotificationType | ''>('')
  const [page, setPage] = useState(1)

  const [notifications, setNotifications] = useState<AdminNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [meta, setMeta] = useState<{ current_page: number; last_page: number; total: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [viewing, setViewing] = useState<AdminNotification | null>(null)
  const [deleting, setDeleting] = useState<AdminNotification | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isMarkingAll, setIsMarkingAll] = useState(false)

  const load = () => {
    setIsLoading(true)
    setError(null)
    fetchAdminNotifications({
      is_read: isReadFilter || undefined,
      type: typeFilter || undefined,
      page,
    })
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

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReadFilter, typeFilter, page])

  const hasFilters = Boolean(isReadFilter || typeFilter)

  const resetFilters = () => {
    setIsReadFilter('')
    setTypeFilter('')
    setPage(1)
  }

  const toggleRead = async (notification: AdminNotification) => {
    try {
      const updated = notification.is_read
        ? await markNotificationUnread(notification.id)
        : await markNotificationRead(notification.id)
      setNotifications((current) => current.map((n) => (n.id === updated.id ? updated : n)))
      setUnreadCount((c) => (updated.is_read ? Math.max(0, c - 1) : c + 1))
      if (viewing?.id === updated.id) setViewing(updated)
    } catch (err) {
      showToast(extractErrorMessage(err, 'Could not update this notification.'), 'error')
    }
  }

  const openDetails = async (notification: AdminNotification) => {
    setViewing(notification)
    if (!notification.is_read) {
      try {
        const updated = await markNotificationRead(notification.id)
        setNotifications((current) => current.map((n) => (n.id === updated.id ? updated : n)))
        setUnreadCount((c) => Math.max(0, c - 1))
        setViewing(updated)
      } catch {
        // Non-critical — the detail view still renders with stale read state.
      }
    }
  }

  const handleMarkAllRead = async () => {
    setIsMarkingAll(true)
    try {
      await markAllNotificationsRead()
      setNotifications((current) => current.map((n) => ({ ...n, is_read: true })))
      setUnreadCount(0)
      showToast('All notifications marked as read.', 'success')
    } catch (err) {
      showToast(extractErrorMessage(err, 'Could not mark all as read.'), 'error')
    } finally {
      setIsMarkingAll(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setIsDeleting(true)
    try {
      await deleteNotification(deleting.id)
      setNotifications((current) => current.filter((n) => n.id !== deleting.id))
      if (!deleting.is_read) setUnreadCount((c) => Math.max(0, c - 1))
      showToast('Notification deleted.', 'success')
      setDeleting(null)
      if (viewing?.id === deleting.id) setViewing(null)
    } catch (err) {
      showToast(extractErrorMessage(err, 'Could not delete this notification.'), 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">Notifications</h2>
          <p className="mt-1 flex items-center gap-2 text-sm text-[var(--admin-text-muted)]">
            {meta ? (
              <>
                <span>{meta.total} total</span>
                {unreadCount > 0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--admin-accent-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--admin-accent)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--admin-accent)]" />
                    {unreadCount} unread
                  </span>
                )}
              </>
            ) : (
              'System and booking activity for your shop.'
            )}
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

      {/* Filters */}
      <div
        className="flex flex-col gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 sm:flex-row sm:flex-wrap sm:items-center"
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

        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value as NotificationType | '')
            setPage(1)
          }}
          className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none"
        >
          {TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-alt)]"
          >
            Reset
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-[var(--admin-danger)]/30 bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]">
          <span>{error}</span>
          <button type="button" onClick={load} className="font-medium underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      {/* List */}
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
              {hasFilters ? 'No notifications match these filters.' : 'No notifications yet.'}
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
                  'flex items-start gap-3 border-b border-[var(--admin-border)] px-4 py-4 last:border-0 hover:bg-[var(--admin-surface-alt)]/60',
                  !notification.is_read && 'bg-[var(--admin-accent-soft)]/20'
                )}
              >
                <button
                  type="button"
                  onClick={() => openDetails(notification)}
                  className="flex min-w-0 flex-1 items-start gap-3 text-left"
                >
                  <span className={cn('mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full', meta.softTone)}>
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-[var(--admin-text)]">{notification.title}</span>
                      {!notification.is_read && (
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--admin-accent)]" />
                      )}
                      {notification.data.booking_reference && (
                        <span className="rounded-full bg-[var(--admin-surface-alt)] px-2 py-0.5 font-mono text-[10px] text-[var(--admin-text-muted)]">
                          {notification.data.booking_reference}
                        </span>
                      )}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-[var(--admin-text-muted)]">
                      {notification.message}
                    </span>
                    <span className="mt-1 block text-xs text-[var(--admin-text-subtle)]">
                      {timeAgo(notification.created_at)}
                    </span>
                  </span>
                </button>

                <div className="flex shrink-0 items-center gap-1 pt-1">
                  <button
                    type="button"
                    title={notification.is_read ? 'Mark as unread' : 'Mark as read'}
                    onClick={() => toggleRead(notification)}
                    className="rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-alt)] hover:text-[var(--admin-text)]"
                  >
                    {notification.is_read ? <Mail className="h-4 w-4" /> : <MailOpen className="h-4 w-4" />}
                  </button>
                  <button
                    type="button"
                    title="Delete"
                    onClick={() => setDeleting(notification)}
                    className="rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-[var(--admin-danger-soft)] hover:text-[var(--admin-danger)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )
          })}

        {/* Pagination */}
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

      {/* Detail modal */}
      {viewing && (
        <Modal title={viewing.title} onClose={() => setViewing(null)} maxWidth="max-w-lg">
          <NotificationDetails notification={viewing} />
          <div className="mt-5 flex justify-end gap-3 border-t border-[var(--admin-border)] pt-4">
            <button
              type="button"
              onClick={() => toggleRead(viewing)}
              className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-medium text-[var(--admin-text)] hover:bg-[var(--admin-surface-alt)]"
            >
              Mark as {viewing.is_read ? 'unread' : 'read'}
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleting(viewing)
              }}
              className="rounded-lg bg-[var(--admin-danger)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleting && (
        <ConfirmDialog
          title="Delete notification?"
          message="This notification will be permanently removed. This doesn't affect the underlying appointment or payment record."
          confirmLabel="Delete"
          danger
          isSubmitting={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}

function NotificationDetails({ notification }: { notification: AdminNotification }) {
  const { data, notifiable_type } = notification

  return (
    <div className="space-y-3 text-sm">
      <p className="text-[var(--admin-text-muted)]">{notification.message}</p>
      <Row label="Received" value={timeAgo(notification.created_at)} />

      {notifiable_type === 'Appointment' && (
        <>
          <Row label="Booking Reference" value={data.booking_reference ?? '—'} />
          <Row label="Customer" value={data.customer_name ?? '—'} />
          <Row label="Service" value={data.service_name ?? '—'} />
          <Row label="Barber" value={data.barber_name ?? '—'} />
          <Row label="Date" value={data.appointment_date ? formatDate(data.appointment_date) : '—'} />
          <Row label="Time" value={data.start_time ? formatTime(data.start_time) : '—'} />
          <Row label="Status" value={data.status ? statusLabelSafe(data.status) : '—'} />
        </>
      )}

      {notifiable_type === 'Payment' && (
        <>
          <Row label="Booking Reference" value={data.booking_reference ?? '—'} />
          <Row label="Customer" value={data.customer_name ?? '—'} />
          <Row label="Amount" value={data.amount != null ? formatCurrency(data.amount) : '—'} />
          <Row label="Method" value={data.method ? statusLabelSafe(data.method) : '—'} />
          <Row label="Status" value={data.status ? statusLabelSafe(data.status) : '—'} />
          <Row label="Transaction Reference" value={data.transaction_reference || '—'} />
        </>
      )}

      {notifiable_type === 'User' && (
        <>
          <Row label="Customer Name" value={data.customer_name ?? '—'} />
          <Row label="Email" value={data.customer_email ?? '—'} />
          <Row label="Registered" value={data.registered_at ? formatDate(data.registered_at.slice(0, 10)) : '—'} />
        </>
      )}
    </div>
  )
}

function statusLabelSafe(value: string): string {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--admin-border)] py-1.5 last:border-0">
      <span className="text-[var(--admin-text-muted)]">{label}</span>
      <span className="max-w-[60%] truncate text-right font-medium text-[var(--admin-text)]">{value}</span>
    </div>
  )
}
