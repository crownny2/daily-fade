import { Check } from 'lucide-react'
import { fetchBarbers } from '@/api/barbers'
import { useFetch } from '@/hooks/useFetch'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { cn } from '@/utils/cn'
import { barberPhoto } from '@/utils/media'
import type { Barber } from '@/types'

interface BarberSelectorProps {
  selected: Barber | null
  onSelect: (barber: Barber) => void
}

export function BarberSelector({ selected, onSelect }: BarberSelectorProps) {
  const { data: barbers, isLoading, error, refetch } = useFetch(fetchBarbers)

  if (isLoading) return <LoadingSpinner label="Loading barbers…" />
  if (error) return <ErrorMessage message={error} onRetry={refetch} />
  if (!barbers || barbers.length === 0) {
    return <EmptyState title="No barbers available" description="Please check back soon." />
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {barbers.map((barber) => {
        const isSelected = selected?.id === barber.id

        if (isSelected) {
          // Selected barber: full-bleed hero card with overlaid name/specialty.
          return (
            <button
              key={barber.id}
              type="button"
              aria-pressed
              onClick={() => onSelect(barber)}
              className="group relative flex flex-col items-start overflow-hidden rounded-2xl border border-accent text-left shadow-gold cursor-pointer"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden">
                <img
                  src={barberPhoto(barber.id)}
                  alt={barber.name}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/30 to-transparent" />
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-canvas shadow-gold">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <p className="font-display text-lg text-bone">{barber.name}</p>
                  {barber.specialty && (
                    <p className="mt-0.5 font-mono text-xs uppercase tracking-wide text-gold">{barber.specialty}</p>
                  )}
                </div>
              </div>
              <div className="flex w-full items-center justify-center gap-1.5 border-t border-accent/30 bg-accent-soft/20 py-2.5">
                <Check className="h-3.5 w-3.5 text-accent-dark" strokeWidth={2.5} />
                <span className="font-mono text-xs uppercase tracking-wide text-accent-dark">Selected</span>
              </div>
            </button>
          )
        }

        // Unselected barbers: compact horizontal card — thumb left, details right.
        return (
          <button
            key={barber.id}
            type="button"
            aria-pressed={false}
            onClick={() => onSelect(barber)}
            className={cn(
              'group flex flex-col items-start gap-3 overflow-hidden rounded-2xl border border-line bg-canvas-raised p-4 text-left transition-all cursor-pointer',
              'hover:border-accent/50 hover:shadow-card'
            )}
          >
            <div className="flex w-full items-start gap-3">
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                <img
                  src={barberPhoto(barber.id)}
                  alt={barber.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div>
                <p className="font-display text-base text-ink">{barber.name}</p>
                {barber.specialty && (
                  <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wide text-accent-dark">
                    {barber.specialty}
                  </p>
                )}
              </div>
            </div>
            {barber.bio && <p className="text-xs text-ink-soft">{barber.bio}</p>}
            <span className="mt-auto w-full rounded-lg border border-line py-2 text-center text-xs font-medium text-ink transition-colors group-hover:border-accent group-hover:text-accent-dark">
              Select Barber
            </span>
          </button>
        )
      })}
    </div>
  )
}
