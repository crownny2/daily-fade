import { useState } from 'react'
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'

interface DateSelectorProps {
  selected: string | null
  onSelect: (date: string) => void
}

const WEEKDAY_LABELS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']

function toISODate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function startOfDay(date: Date): Date {
  const d = new Date(date)
  d.setHours(0, 0, 0, 0)
  return d
}

interface Cell {
  date: Date
  inCurrentMonth: boolean
}

export function DateSelector({ selected, onSelect }: DateSelectorProps) {
  const today = startOfDay(new Date())
  const selectedDate = selected ? startOfDay(new Date(`${selected}T00:00:00`)) : null
  const [viewDate, setViewDate] = useState(() => {
    const base = selectedDate ?? today
    return new Date(base.getFullYear(), base.getMonth(), 1)
  })

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const leadingBlanks = firstOfMonth.getDay()
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const isPastDate = (d: Date) => d.getTime() < today.getTime()
  const isClosedDay = (d: Date) => d.getDay() === 0

  const cells: Cell[] = [
    ...Array.from({ length: leadingBlanks }, (_, i) => ({
      date: new Date(year, month - 1, daysInPrevMonth - leadingBlanks + i + 1),
      inCurrentMonth: false,
    })),
    ...Array.from({ length: daysInMonth }, (_, i) => ({
      date: new Date(year, month, i + 1),
      inCurrentMonth: true,
    })),
  ]
  const trailingBlanks = (7 - (cells.length % 7)) % 7
  cells.push(
    ...Array.from({ length: trailingBlanks }, (_, i) => ({
      date: new Date(year, month + 1, i + 1),
      inCurrentMonth: false,
    }))
  )

  const canGoPrevMonth = year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth())
  const isViewingCurrentMonth = year === today.getFullYear() && month === today.getMonth()
  const monthLabel = viewDate.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })
  const monthKey = `${year}-${month}`

  const jumpToToday = () => setViewDate(new Date(today.getFullYear(), today.getMonth(), 1))
  const goToMonth = (date: Date) => setViewDate(new Date(date.getFullYear(), date.getMonth(), 1))

  return (
    <div className="flex flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.08] bg-[#15151c] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset,0_24px_60px_-24px_rgba(0,0,0,0.55),0_4px_12px_-4px_rgba(0,0,0,0.3)]">
        {/* Top gradient accent line */}
        <div className="h-[2px] w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500/30" />

        {/* Ambient glow, contained, subtle */}
        <div className="pointer-events-none absolute -top-32 right-0 h-64 w-64 rounded-full bg-amber-500/[0.06] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-56 w-56 rounded-full bg-amber-500/[0.04] blur-3xl" />

        <div className="relative p-5 sm:p-6">
          {/* Month header */}
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              aria-label="Previous month"
              disabled={!canGoPrevMonth}
              onClick={() => setViewDate(new Date(year, month - 1, 1))}
              className={cn(
                'flex h-8 w-8 shrink-0 appearance-none items-center justify-center rounded-lg border-0 outline-none ring-1 ring-inset transition-all duration-150 focus-visible:ring-2 focus-visible:ring-amber-400/60',
                canGoPrevMonth
                  ? 'cursor-pointer bg-white/[0.03] text-bone/70 ring-white/10 hover:bg-amber-500/10 hover:text-amber-300 hover:ring-amber-400/30'
                  : 'cursor-not-allowed bg-transparent text-bone/15 ring-white/5'
              )}
            >
              <ChevronLeft className="h-3.5 w-3.5" strokeWidth={2} />
            </button>

            <div className="flex min-w-0 flex-col items-center gap-0.5">
              <p className="font-display text-[19px] font-medium tracking-tight text-bone">{monthLabel}</p>
              {isViewingCurrentMonth ? (
                <span className="flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-wider text-bone/30">
                  This month
                  <ChevronDown className="h-2.5 w-2.5" strokeWidth={2.5} />
                </span>
              ) : (
                <button
                  type="button"
                  onClick={jumpToToday}
                  className="cursor-pointer appearance-none border-0 bg-transparent text-[10.5px] font-semibold uppercase tracking-wider text-amber-400 outline-none transition-colors hover:text-amber-300 focus-visible:text-amber-300"
                >
                  Jump to today
                </button>
              )}
            </div>

            <button
              type="button"
              aria-label="Next month"
              onClick={() => setViewDate(new Date(year, month + 1, 1))}
              className="flex h-8 w-8 shrink-0 cursor-pointer appearance-none items-center justify-center rounded-lg border-0 bg-white/[0.03] text-bone/70 outline-none ring-1 ring-inset ring-white/10 transition-all duration-150 hover:bg-amber-500/10 hover:text-amber-300 hover:ring-amber-400/30 focus-visible:ring-2 focus-visible:ring-amber-400/60"
            >
              <ChevronRight className="h-3.5 w-3.5" strokeWidth={2} />
            </button>
          </div>

          {/* Divider */}
          <div className="mt-5 h-px w-full bg-white/[0.06]" />

          {/* Weekday row */}
          <div className="mt-4 grid grid-cols-7">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="py-1 text-center font-mono text-[10px] font-semibold tracking-widest text-bone/30">
                {label}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div key={monthKey} className="mt-2 grid grid-cols-7 gap-1 animate-[fadeIn_0.18s_ease-out]">
            {cells.map(({ date, inCurrentMonth }, idx) => {
              const iso = toISODate(date)
              const closed = isClosedDay(date)
              const past = isPastDate(date)
              const disabled = !inCurrentMonth || past || closed
              const isSelected = selectedDate !== null && date.getTime() === selectedDate.getTime()
              const isToday = date.getTime() === today.getTime()

              if (!inCurrentMonth) {
                return (
                  <button
                    key={`${idx}-${iso}`}
                    type="button"
                    onClick={() => goToMonth(date)}
                    aria-label={`Go to ${date.toLocaleDateString('en-PH', { month: 'long', year: 'numeric' })}`}
                    className="flex aspect-square w-full min-h-[38px] cursor-pointer appearance-none items-center justify-center rounded-full border-0 bg-transparent font-mono text-[13px] font-medium text-bone/15 outline-none transition-colors hover:text-bone/30"
                  >
                    {date.getDate()}
                  </button>
                )
              }

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={disabled}
                  aria-pressed={isSelected}
                  aria-label={`${date.toLocaleDateString('en-PH', { weekday: 'long', month: 'long', day: 'numeric' })}${
                    closed && !past ? ', closed' : disabled ? ', unavailable' : ''
                  }`}
                  title={closed && !past ? 'Closed on Sundays' : undefined}
                  onClick={() => onSelect(iso)}
                  className={cn(
                    'relative flex aspect-square w-full min-h-[38px] appearance-none items-center justify-center rounded-full border-0 font-mono text-[13px] font-medium outline-none transition-all duration-150 focus-visible:ring-2 focus-visible:ring-amber-400/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#15151c]',
                    disabled
                      ? cn(
                          'cursor-not-allowed text-bone/15',
                          closed && !past ? 'bg-transparent' : 'bg-white/[0.015] line-through decoration-bone/15'
                        )
                      : isSelected
                        ? 'cursor-pointer bg-gradient-to-b from-amber-400 to-amber-600 text-[#1a1408] shadow-[0_0_0_1px_rgba(255,255,255,0.15)_inset,0_4px_16px_-2px_rgba(217,158,44,0.55)]'
                        : isToday
                          ? 'cursor-pointer bg-amber-500/[0.1] text-amber-300 ring-1 ring-inset ring-amber-400/40 hover:bg-amber-500/[0.16]'
                          : 'cursor-pointer bg-transparent text-bone/75 hover:bg-white/[0.05] hover:text-bone'
                  )}
                >
                  {date.getDate()}
                  {isToday && !isSelected && (
                    <span className="absolute bottom-[5px] left-1/2 h-[3px] w-[3px] -translate-x-1/2 rounded-full bg-amber-400" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-white/[0.06] bg-white/[0.015] px-4 py-2.5 font-mono text-[10.5px] font-medium uppercase tracking-wide text-bone/40">
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gradient-to-br from-amber-400 to-amber-600" /> Selected
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full ring-1 ring-inset ring-amber-400/50" /> Today
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/5" />
          Closed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-white/[0.03] opacity-60" />
          Past
        </span>
      </div>
    </div>
  )
}