import { CalendarDays, Clock } from 'lucide-react'
import { fetchAvailability } from '@/api/barbers'
import { useFetch } from '@/hooks/useFetch'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { formatDateLong, formatTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { AvailabilitySlot } from '@/types'

interface TimeSlotSelectorProps {
  barberId: number
  date: string
  serviceId: number
  selected: AvailabilitySlot | null
  onSelect: (slot: AvailabilitySlot) => void
  onChangeDate?: () => void
}

function getHour(startTime: string): number {
  return new Date(`1970-01-01T${startTime}`).getHours()
}

function groupByPeriod(slots: AvailabilitySlot[]) {
  const groups: { label: string; slots: AvailabilitySlot[] }[] = [
    { label: 'Morning', slots: [] },
    { label: 'Afternoon', slots: [] },
    { label: 'Evening', slots: [] },
  ]
  for (const slot of slots) {
    const hour = getHour(slot.start_time)
    if (hour < 12) groups[0].slots.push(slot)
    else if (hour < 17) groups[1].slots.push(slot)
    else groups[2].slots.push(slot)
  }
  return groups.filter((g) => g.slots.length > 0)
}

export function TimeSlotSelector({ barberId, date, serviceId, selected, onSelect, onChangeDate }: TimeSlotSelectorProps) {
  const {
    data: availability,
    isLoading,
    error,
    refetch,
  } = useFetch(() => fetchAvailability(barberId, date, serviceId), [barberId, date, serviceId])

  const slots = availability?.slots ?? []
  const openCount = slots.filter((s) => s.available).length

  const selectedDateBar = (
    <div className="mb-6 flex items-center justify-between gap-3 rounded-2xl border border-line bg-canvas-raised px-4 py-3.5 shadow-card">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft/40 text-accent-dark">
          <CalendarDays className="h-4 w-4" strokeWidth={1.75} />
        </span>
        <div>
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-widest text-ink-faint/80">Selected date</p>
          <p className="font-display text-base text-ink">{formatDateLong(date)}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {!isLoading && !error && slots.length > 0 && (
          <span className="hidden items-center gap-1.5 rounded-full border border-line bg-canvas px-2.5 py-1 font-mono text-[11px] font-medium text-ink-soft sm:flex">
            <Clock className="h-3 w-3" strokeWidth={2} />
            {openCount} open
          </span>
        )}
        {onChangeDate && (
          <button
            type="button"
            onClick={onChangeDate}
            className="cursor-pointer rounded-lg border border-line px-3 py-1.5 text-xs font-medium text-ink transition-colors hover:border-accent hover:bg-accent-soft/20 hover:text-accent-dark"
          >
            Change
          </button>
        )}
      </div>
    </div>
  )

  if (isLoading) {
    return (
      <div>
        {selectedDateBar}
        <LoadingSpinner label="Checking availability…" />
      </div>
    )
  }

  if (error) {
    return (
      <div>
        {selectedDateBar}
        <ErrorMessage message={error} onRetry={refetch} />
      </div>
    )
  }

  if (slots.length === 0) {
    return (
      <div>
        {selectedDateBar}
        <EmptyState
          title="No open slots"
          description={availability?.message ?? 'This barber is fully booked on this date. Try another date.'}
        />
      </div>
    )
  }

  const hasAnyAvailable = openCount > 0
  const periods = groupByPeriod(slots)

  return (
    <div>
      {selectedDateBar}

      <div className="flex flex-col gap-6">
        {periods.map((period) => (
          <div key={period.label}>
            <p className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-widest text-ink-faint/70">
              {period.label}
              <span className="ml-2 text-ink-faint/40">
                {period.slots.filter((s) => s.available).length}/{period.slots.length}
              </span>
            </p>
            <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
              {period.slots.map((slot) => {
                const isSelected = selected?.start_time === slot.start_time
                const isDisabled = !slot.available
                return (
                  <button
                    key={slot.start_time}
                    type="button"
                    disabled={isDisabled}
                    aria-pressed={isSelected}
                    aria-label={
                      isDisabled ? `${formatTime(slot.start_time)}, booked` : `${formatTime(slot.start_time)}, available`
                    }
                    onClick={() => !isDisabled && onSelect(slot)}
                    className={cn(
                      'relative flex flex-col items-center justify-center gap-0.5 rounded-xl border px-3 py-3 font-mono text-sm font-medium transition-all duration-150',
                      isDisabled
                        ? 'cursor-not-allowed border-line/50 bg-canvas text-ink-faint/50 line-through'
                        : isSelected
                          ? 'cursor-pointer border-accent bg-accent text-canvas shadow-gold'
                          : 'cursor-pointer border-line bg-canvas-raised text-ink-soft hover:border-accent hover:bg-accent-soft/20 hover:text-ink'
                    )}
                  >
                    {formatTime(slot.start_time)}
                    {isDisabled && (
                      <span className="font-sans text-[9.5px] font-semibold uppercase tracking-wider text-ink-faint/50">
                        Booked
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {!hasAnyAvailable && (
        <div className="mt-6">
          <EmptyState
            title="No available time slots for this date"
            description="Every slot on this date is already booked. Try another date."
          />
        </div>
      )}
    </div>
  )
}