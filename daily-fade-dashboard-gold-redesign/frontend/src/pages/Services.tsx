import { useNavigate } from 'react-router-dom'
import { fetchServices } from '@/api/services'
import { useFetch } from '@/hooks/useFetch'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDuration } from '@/utils/format'
import { servicePhoto, servicePhotoFallback, HERO_IMAGE_URL } from '@/utils/media'

export function Services() {
  const { data: services, isLoading, error, refetch } = useFetch(fetchServices)
  const navigate = useNavigate()

  return (
    <div>
      <section className="relative overflow-hidden px-6 py-20 text-center text-bone">
        <img src={HERO_IMAGE_URL} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-noir/80" aria-hidden="true" />
        <div className="pattern-barber-stripes pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-gold">Our Services</p>
          <h1 className="mt-3 font-display text-4xl text-bone sm:text-5xl">
            Premium Grooming <span className="text-gold-gradient">Services</span>
          </h1>
          <p className="mt-4 text-bone-soft">
            Every service is performed by skilled barbers using premium products and precise techniques. Because you
            deserve nothing less.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {isLoading && <LoadingSpinner label="Loading services…" />}
        {error && <ErrorMessage message={error} onRetry={refetch} />}
        {!isLoading && !error && (!services || services.length === 0) && (
          <EmptyState title="No services yet" description="Our menu is being updated. Please check back soon." />
        )}
        {!isLoading && !error && services && services.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <Card
                key={service.id}
                className="group flex flex-col justify-between overflow-hidden transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-gold"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={servicePhoto(service.id, service.name)}
                    alt=""
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                    onError={(e) => {
                      // Broken/missing image file - fall back instead of leaving a blank box.
                      e.currentTarget.onerror = null
                      e.currentTarget.src = servicePhotoFallback(service.id)
                    }}
                  />
                </div>
                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <h3 className="font-display text-xl text-ink">{service.name}</h3>
                    {service.description && <p className="mt-2 text-sm text-ink-soft">{service.description}</p>}
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="font-mono text-xs text-ink-faint">
                      <p>{formatDuration(service.duration_minutes)}</p>
                      <p className="mt-0.5 text-accent-dark">{formatCurrency(service.price)}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => navigate('/book')}>
                      Book Now
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}