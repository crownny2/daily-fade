import { fetchServices } from '@/api/services'
import { useFetch } from '@/hooks/useFetch'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { Check } from 'lucide-react'
import { formatCurrency, formatDuration } from '@/utils/format'
import { cn } from '@/utils/cn'
import { servicePhoto } from '@/utils/media'
import { serviceIcon } from '@/utils/serviceIcon'
import type { Service } from '@/types'

interface ServiceSelectorProps {
  selected: Service | null
  onSelect: (service: Service) => void
}

export function ServiceSelector({ selected, onSelect }: ServiceSelectorProps) {
  const { data: services, isLoading, error, refetch } = useFetch(fetchServices)

  if (isLoading) return <LoadingSpinner label="Loading services…" />
  if (error) return <ErrorMessage message={error} onRetry={refetch} />
  if (!services || services.length === 0) {
    return <EmptyState title="No services available" description="Please check back soon." />
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {services.map((service) => {
        const isSelected = selected?.id === service.id
        const Icon = serviceIcon(service.name)
        return (
          <button
            key={service.id}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(service)}
            className={cn(
              'group relative flex flex-col overflow-hidden rounded-2xl border text-left transition-all cursor-pointer bg-noir',
              isSelected ? 'border-accent shadow-gold' : 'border-line/40 hover:border-accent/50 hover:shadow-card'
            )}
          >
            {/* Photo with bottom gradient + icon/name/description overlay */}
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <img
                src={servicePhoto(service.id, service.name)}
                alt=""
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-noir via-noir/40 to-transparent" />
              {isSelected && (
                <span className="absolute right-3 top-3 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-canvas shadow-gold">
                  <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-start gap-2.5 p-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-gold/50 bg-noir/70 text-gold">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <div>
                  <p className="font-display text-base leading-tight text-bone">{service.name}</p>
                  {service.description && (
                    <p className="mt-0.5 line-clamp-1 text-xs text-bone-soft/80">{service.description}</p>
                  )}
                </div>
              </div>
            </div>
            {/* Footer strip: duration + price */}
            <div className="flex items-center justify-between border-t border-gold-soft/20 bg-noir px-4 py-3 font-mono text-xs">
              <span className="text-bone-soft">{formatDuration(service.duration_minutes)}</span>
              <span className="text-gold">{formatCurrency(service.price)}</span>
            </div>
          </button>
        )
      })}
    </div>
  )
}
