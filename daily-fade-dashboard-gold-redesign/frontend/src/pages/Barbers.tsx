import { useNavigate } from 'react-router-dom'
import { fetchBarbers } from '@/api/barbers'
import { useFetch } from '@/hooks/useFetch'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { barberPhoto, HERO_IMAGE_URL } from '@/utils/media'

export function Barbers() {
  const { data: barbers, isLoading, error, refetch } = useFetch(fetchBarbers)
  const navigate = useNavigate()

  return (
    <div>
      <section className="relative overflow-hidden px-6 py-20 text-center text-bone">
        <img src={HERO_IMAGE_URL} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-noir/80" aria-hidden="true" />
        <div className="pattern-barber-stripes pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.35em] text-gold">Meet The Team</p>
          <h1 className="mt-3 font-display text-4xl text-bone sm:text-5xl">
            Our <span className="text-gold-gradient">Barbers</span>
          </h1>
          <p className="mt-4 text-bone-soft">
            Skilled professionals who take pride in every cut. Each barber has their own specialty to match your
            style.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-6 py-16">
        {isLoading && <LoadingSpinner label="Loading barbers…" />}
        {error && <ErrorMessage message={error} onRetry={refetch} />}
        {!isLoading && !error && (!barbers || barbers.length === 0) && (
          <EmptyState title="No barbers yet" description="Our roster is being updated. Please check back soon." />
        )}
        {!isLoading && !error && barbers && barbers.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {barbers.map((barber) => (
              <Card
                key={barber.id}
                className="group flex flex-col overflow-hidden transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-gold"
              >
                <div className="relative aspect-[4/5] overflow-hidden">
                  <img
                    src={barberPhoto(barber.id)}
                    alt={barber.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-noir/80 to-transparent" />
                  {barber.specialty && (
                    <span className="absolute bottom-3 left-4 font-mono text-[11px] uppercase tracking-wide text-gold-bright">
                      {barber.specialty}
                    </span>
                  )}
                </div>
                <div className="flex flex-1 flex-col items-start gap-3 p-6">
                  <h3 className="font-display text-xl text-ink">{barber.name}</h3>
                  {barber.bio && <p className="text-sm text-ink-soft">{barber.bio}</p>}
                  <Button size="sm" variant="outline" className="mt-auto w-full" onClick={() => navigate('/book')}>
                    Book with {barber.name.split(' ')[0]}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
