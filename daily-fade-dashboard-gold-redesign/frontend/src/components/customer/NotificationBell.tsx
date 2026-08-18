import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Bell, CheckCheck } from 'lucide-react'
import { fetchCustomerNotifications, markCustomerNotificationRead } from '@/api/customer'
import { notificationMeta, notificationTargetPath } from '@/components/customer/notificationMeta'
import { timeAgo } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { CustomerNotification } from '@/types/customer'

const POLL_INTERVAL_MS = 30_000

/**
 * Phase 7D-2: customer-facing equivalent of components/admin/NotificationBell.tsx,
 * restyled with the customer site's own design tokens and wired to the
 * /customer/notifications endpoints. Clicking an item marks it read and
 * navigates to the related appointment.
 */
export function NotificationBell({ dark = false }: { dark?: boolean }) {
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<CustomerNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const load = useCallback(() => {
    setIsLoading(true)
    fetchCustomerNotifications({ per_page: 5 })
      .then((res) => {
        setRecent(res.data ?? [])
        setUnreadCount(res.meta?.unread_count ?? 0)
      })
      .catch(() => {
        // Silent failure — the bell just won't update this cycle. The full
        // Notifications page still shows a real error state if opened.
      })
      .finally(() => setIsLoading(false))
  }, [])

  useEffect(() => {
    load()
    const interval = setInterval(load, POLL_INTERVAL_MS)
    const onFocus = () => load()
    window.addEventListener('focus', onFocus)
    return () => {
      clearInterval(interval)
      window.removeEventListener('focus', onFocus)
    }
  }, [load])

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const handleItemClick = async (notification: CustomerNotification) => {
    if (!notification.is_read) {
      setRecent((current) =>
        current.map((n) => (n.id === notification.id ? { ...n, is_read: true } : n))
      )
      setUnreadCount((c) => Math.max(0, c - 1))
      try {
        await markCustomerNotificationRead(notification.id)
      } catch {
        load()
      }
    }
    setOpen(false)

    const target = notificationTargetPath(notification)
    if (target) navigate(target)
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'relative flex h-9 w-9 items-center justify-center rounded-full border transition-colors',
          dark ? 'border-gold/30 text-bone-soft hover:bg-bone/10' : 'border-line text-ink-soft hover:bg-ink/5'
        )}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold leading-none text-canvas-raised">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden border border-line bg-canvas-raised shadow-card sm:w-96">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-display text-sm text-ink">Notifications</span>
            {unreadCount > 0 && (
              <span className="font-mono text-xs uppercase tracking-wide text-ink-faint">
                {unreadCount} unread
              </span>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {isLoading && recent.length === 0 && (
              <div className="space-y-2 p-4">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="h-10 animate-pulse rounded bg-ink/5" />
                ))}
              </div>
            )}

            {!isLoading && recent.length === 0 && (
              <div className="px-4 py-10 text-center text-sm text-ink-soft">No notifications yet.</div>
            )}

            {recent.map((notification) => {
              const meta = notificationMeta(notification.type)
              const Icon = meta.icon
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleItemClick(notification)}
                  className={cn(
                    'flex w-full items-start gap-3 border-b border-line px-4 py-3 text-left last:border-0 hover:bg-ink/5',
                    !notification.is_read && 'bg-accent-soft/40'
                  )}
                >
                  <span className={cn('mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full', meta.softTone)}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-ink">{notification.title}</span>
                      {!notification.is_read && <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />}
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-ink-soft">{notification.message}</span>
                    <span className="mt-0.5 block text-[11px] text-ink-faint">{timeAgo(notification.created_at)}</span>
                  </span>
                </button>
              )
            })}
          </div>

          <Link
            to="/notifications"
            onClick={() => setOpen(false)}
            className="flex items-center justify-center gap-1.5 border-t border-line px-4 py-2.5 text-sm font-medium text-accent-dark hover:bg-ink/5"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            View all notifications
          </Link>
        </div>
      )}
    </div>
  )
}
