import { cn } from '@/utils/cn'

export const BOOKING_STEPS = [
  'Service',
  'Barber',
  'Date',
  'Time',
  'Details',
  'Review',
] as const

export function BookingStepper({ currentStep, dark = false }: { currentStep: number; dark?: boolean }) {
  return (
    <ol className="flex w-full items-center overflow-x-auto pb-1">
      {BOOKING_STEPS.map((label, index) => {
        const step = index + 1
        const isActive = step === currentStep
        const isDone = step < currentStep
        return (
          <li key={label} className="flex flex-1 min-w-[76px] items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-mono text-xs font-medium border transition-all duration-200',
                  isActive && 'border-gold bg-gold text-noir shadow-gold',
                  isDone && !isActive && (dark ? 'border-bone bg-bone text-noir' : 'border-ink bg-ink text-canvas'),
                  !isActive && !isDone && (dark ? 'border-gold/30 text-bone-soft' : 'border-line text-ink-faint')
                )}
              >
                {isDone ? '✓' : step}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-[11px] tracking-wide',
                  isActive
                    ? dark ? 'text-gold' : 'text-ink'
                    : isDone
                      ? dark ? 'text-bone-soft' : 'text-ink-soft'
                      : dark ? 'text-bone-soft/50' : 'text-ink-faint'
                )}
              >
                {label}
              </span>
            </div>
            {step !== BOOKING_STEPS.length && (
              <span
                className={cn(
                  'mx-2 h-px flex-1 -translate-y-3.5',
                  isDone ? (dark ? 'bg-gold/60' : 'bg-gold') : dark ? 'bg-gold/15' : 'bg-line'
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
