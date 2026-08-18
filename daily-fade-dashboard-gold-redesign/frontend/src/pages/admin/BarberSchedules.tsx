import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CalendarClock, Save } from 'lucide-react'
import { fetchBarberSchedules, updateBarberSchedule } from '@/api/admin'
import { extractErrorMessage } from '@/api/client'
import { useToast } from '@/hooks/useToast'
import { Avatar } from '@/components/admin/Avatar'
import { cn } from '@/utils/cn'
import type { AdminBarberSchedule, DayScheduleItem } from '@/types/admin'

const DAY_ABBR = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function scheduleSummary(schedule: DayScheduleItem[]): string {
  const workingDays = schedule.filter((d) => d.is_available)
  if (workingDays.length === 0) return 'No working days'
  if (workingDays.length === 7) return 'Every day'

  // Build a compact string of abbreviations, e.g. "Mon–Sat" if contiguous, else list.
  const indices = workingDays.map((d) => d.day_of_week).sort((a, b) => a - b)
  const isContiguous = indices.every((v, i) => i === 0 || v === indices[i - 1] + 1)
  if (isContiguous && indices.length > 1) {
    return `${DAY_ABBR[indices[0]]}–${DAY_ABBR[indices[indices.length - 1]]}`
  }
  return indices.map((i) => DAY_ABBR[i]).join(', ')
}

export function AdminBarberSchedules() {
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const barberIdFromUrl = Number(searchParams.get('barber')) || null

  const [barbers, setBarbers] = useState<AdminBarberSchedule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(barberIdFromUrl)

  // Local draft for the currently-selected barber's schedule.
  const [draft, setDraft] = useState<DayScheduleItem[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const load = () => {
    setIsLoading(true)
    setError(null)
    fetchBarberSchedules()
      .then((data) => {
        setBarbers(data)
        if (data.length > 0) setSelectedId((current) => current ?? data[0].id)
      })
      .catch((err) => setError(extractErrorMessage(err, 'Could not load barber schedules.')))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  useEffect(() => {
    const barber = barbers.find((b) => b.id === selectedId)
    if (barber) {
      setDraft(barber.schedule.map((d) => ({ ...d })))
      setIsDirty(false)
      setSaveError(null)
    }
  }, [selectedId, barbers])

  const selected = barbers.find((b) => b.id === selectedId) ?? null

  const updateDay = (day: number, patch: Partial<DayScheduleItem>) => {
    setDraft((current) => current.map((d) => (d.day_of_week === day ? { ...d, ...patch } : d)))
    setIsDirty(true)
  }

  const save = async () => {
    if (!selected) return
    setSaveError(null)

    for (const day of draft) {
      if (day.is_available && day.start_time >= day.end_time) {
        setSaveError(`${day.day_name}: end time must be after start time.`)
        return
      }
    }

    setIsSaving(true)
    try {
      const updated = await updateBarberSchedule(selected.id, draft)
      setBarbers((current) => current.map((b) => (b.id === updated.id ? updated : b)))
      setIsDirty(false)
      showToast(`Schedule saved for ${updated.name}.`, 'success')
    } catch (err) {
      setSaveError(extractErrorMessage(err, 'Could not save schedule.'))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-[var(--admin-text)]">Barber Schedules</h2>
        <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
          Set weekly working hours for each barber. Changes apply immediately to booking availability.
        </p>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-[var(--admin-danger)]/30 bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]">
          <span>{error}</span>
          <button type="button" onClick={load} className="font-medium underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-xl bg-[var(--admin-surface-alt)]" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[280px_1fr]">
          {/* Barber list */}
          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-2" style={{ boxShadow: 'var(--admin-shadow)' }}>
            {barbers.map((barber) => (
              <button
                key={barber.id}
                type="button"
                onClick={() => {
                  setSelectedId(barber.id)
                  if (searchParams.get('barber')) setSearchParams({})
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors',
                  barber.id === selectedId
                    ? 'bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]'
                    : 'text-[var(--admin-text)] hover:bg-[var(--admin-surface-alt)]'
                )}
              >
                <Avatar name={barber.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate font-medium">{barber.name}</span>
                    <span
                      className={cn(
                        'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        barber.id === selectedId
                          ? 'bg-[var(--admin-accent)]/15 text-[var(--admin-accent)]'
                          : 'bg-[var(--admin-surface-alt)] text-[var(--admin-text-muted)]'
                      )}
                    >
                      {scheduleSummary(barber.schedule)}
                    </span>
                  </span>
                  {barber.specialty && (
                    <span className="mt-0.5 block truncate text-xs text-[var(--admin-text-muted)]">{barber.specialty}</span>
                  )}
                </span>
              </button>
            ))}
          </div>

          {/* Schedule editor */}
          <div className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5" style={{ boxShadow: 'var(--admin-shadow)' }}>
            {!selected ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center text-center">
                <CalendarClock className="h-8 w-8 text-[var(--admin-text-subtle)]" />
                <p className="mt-2 text-sm text-[var(--admin-text-muted)]">Select a barber to edit their schedule.</p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar name={selected.name} />
                    <h3 className="text-sm font-semibold text-[var(--admin-text)]">{selected.name}'s weekly schedule</h3>
                  </div>
                  <button
                    type="button"
                    onClick={save}
                    disabled={!isDirty || isSaving}
                    className="flex items-center gap-2 rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--admin-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSaving ? (
                      <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    Save Schedule
                  </button>
                </div>

                {saveError && (
                  <div className="rounded-lg bg-[var(--admin-danger-soft)] px-3 py-2.5 text-sm text-[var(--admin-danger)]">
                    {saveError}
                  </div>
                )}

                <div className="divide-y divide-[var(--admin-border)]">
                  {draft.map((day) => (
                    <div key={day.day_of_week} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-24 shrink-0 text-sm font-medium text-[var(--admin-text)]">{day.day_name}</span>
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={day.is_available}
                            onChange={(e) => updateDay(day.day_of_week, { is_available: e.target.checked })}
                            className="h-4 w-4 rounded border-[var(--admin-border)]"
                          />
                          <span className={day.is_available ? 'text-[var(--admin-success)]' : 'text-[var(--admin-text-muted)]'}>
                            {day.is_available ? 'Working' : 'Day Off'}
                          </span>
                        </label>
                      </div>

                      {day.is_available && (
                        <div className="flex items-center gap-2">
                          <input
                            type="time"
                            value={day.start_time}
                            onChange={(e) => updateDay(day.day_of_week, { start_time: e.target.value })}
                            className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-2.5 py-1.5 text-sm text-[var(--admin-text)] outline-none"
                          />
                          <span className="text-[var(--admin-text-muted)]">to</span>
                          <input
                            type="time"
                            value={day.end_time}
                            onChange={(e) => updateDay(day.day_of_week, { end_time: e.target.value })}
                            className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-2.5 py-1.5 text-sm text-[var(--admin-text)] outline-none"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
