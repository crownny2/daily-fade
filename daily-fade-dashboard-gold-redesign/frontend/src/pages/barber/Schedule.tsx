import { useEffect, useState } from 'react'
import { CalendarClock, Info } from 'lucide-react'
import { fetchBarberSchedule } from '@/api/barber'
import { extractErrorMessage } from '@/api/client'
import { formatTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { BarberScheduleDay } from '@/types/barber'

/**
 * Read-only by design (see Phase 7C-2 spec): the admin remains the only
 * one who can edit a barber's weekly schedule, via
 * Api\Admin\BarberScheduleController::update(). This page just displays
 * GET /api/barber/schedule, which is built from the exact same
 * barber_schedules rows - no second schedule system.
 */
export function BarberSchedule() {
  const [days, setDays] = useState<BarberScheduleDay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    setIsLoading(true)
    setError(null)
    fetchBarberSchedule()
      .then((data) => setDays(data.schedule))
      .catch((err) => setError(extractErrorMessage(err, 'Could not load your schedule.')))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-[var(--admin-text)]">My Schedule</h2>
        <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
          Your working days and hours, as set by the shop admin.
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-accent-soft)]/40 px-4 py-3 text-sm text-[var(--admin-text-muted)]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--admin-accent)]" />
        <span>
          This is a read-only view. If you need a day off or a change to your hours, contact the shop admin — they
          manage barber schedules.
        </span>
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
            {[0, 1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-[var(--admin-surface-alt)]" />
            ))}
          </div>
        )}

        {!isLoading &&
          days.map((day) => (
            <div
              key={day.day_of_week}
              className="flex items-center justify-between border-b border-[var(--admin-border)] px-4 py-3.5 last:border-0"
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    day.is_available
                      ? 'bg-[var(--admin-success-soft)] text-[var(--admin-success)]'
                      : 'bg-[var(--admin-surface-alt)] text-[var(--admin-text-subtle)]'
                  )}
                >
                  <CalendarClock className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium text-[var(--admin-text)]">{day.day_name}</span>
              </div>

              {day.is_available ? (
                <span className="text-sm text-[var(--admin-text-muted)]">
                  {formatTime(day.start_time)} – {formatTime(day.end_time)}
                </span>
              ) : (
                <span className="rounded-full bg-[var(--admin-surface-alt)] px-2.5 py-1 text-xs font-medium text-[var(--admin-text-subtle)]">
                  Day off
                </span>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}
