import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, ArrowUpRight } from 'lucide-react'
import { fetchServices } from '@/api/services'
import { fetchBarbers } from '@/api/barbers'
import { useFetch } from '@/hooks/useFetch'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { formatCurrency, formatDuration } from '@/utils/format'
import { barberPhoto, servicePhoto, HERO_IMAGE_URL } from '@/utils/media'

const businessHours = [
  { day: 'Monday – Friday', hours: '9:00 AM – 6:00 PM' },
  { day: 'Saturday', hours: '9:00 AM – 6:00 PM' },
  { day: 'Sunday', hours: 'Closed' },
]

export function Landing() {
  const navigate = useNavigate()
  const { data: services, isLoading: servicesLoading, error: servicesError } = useFetch(fetchServices)
  const { data: barbers, isLoading: barbersLoading, error: barbersError } = useFetch(fetchBarbers)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden px-6 py-28 text-bone md:py-40">
        <img
          src={HERO_IMAGE_URL}
          alt="A barber precisely cutting a customer's hair in the chair"
          className="absolute inset-0 h-full w-full object-cover"
          loading="eager"
        />
        {/*
          Single, lighter readability overlay. Previously this stacked a flat
          bg-noir/55 wash UNDER a second noir/85→transparent gradient, which
          doubled up in the middle of the image and made the whole photo look
          heavy/hazy instead of just dimming enough for the text to read.
          One gradient — darkest at the bottom where text/buttons sit, clear
          near the top — does the same readability job without the extra haze.
        */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-noir/75 via-noir/30 to-noir/10"
          aria-hidden="true"
        />
        <div className="pattern-barber-stripes pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-4xl text-center">
          <p className="animate-fade-up font-mono text-xs uppercase tracking-[0.35em] text-bone">
            Est. Davao City
          </p>
          <div className="mx-auto mt-5 h-px w-16 divider-gold animate-reveal-line" />
          <h1 className="animate-slide-up mt-6 font-display text-5xl leading-[1.05] md:text-7xl">
            More Than a Cut.
            <br />
            It&rsquo;s Your{' '}
            <span className="text-gold-gradient">Signature.</span>
          </h1>
          <p
            className="animate-slide-up mx-auto mt-6 max-w-lg text-base text-bone-soft md:text-lg"
            style={{ animationDelay: '0.1s' }}
          >
            Precision cuts, clean fades, and timeless style crafted by professionals who take
            pride in every detail.
          </p>
          <div
            className="animate-slide-up mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
            style={{ animationDelay: '0.2s' }}
          >
            <Button
              size="lg"
              className="bg-gold! text-noir! hover:bg-gold-bright!"
              onClick={() => navigate('/book')}
            >
              Book Appointment
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-bone/30! text-bone! hover:bg-bone! hover:text-noir!"
              onClick={() => navigate('/services')}
            >
              View Services
            </Button>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="border-b border-line bg-canvas-raised px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-accent-dark">The menu</p>
              <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">Services We Offer</h2>
            </div>
            <Link
              to="/services"
              className="hidden items-center gap-1 text-sm text-ink-soft transition-colors hover:text-accent-dark sm:inline-flex"
            >
              View all services <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-10">
            {servicesLoading && <LoadingSpinner label="Loading services…" />}
            {servicesError && <ErrorMessage message={servicesError} />}
            {!servicesLoading && !servicesError && services && (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {services.slice(0, 4).map((service) => (
                  <Card
                    key={service.id}
                    className="group relative overflow-hidden border-line transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-gold"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={servicePhoto(service.id, service.name)}
                        alt=""
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-accent transition-transform duration-300 group-hover:scale-x-100" />
                    </div>
                    <div className="p-6">
                      <p className="font-display text-lg text-ink">{service.name}</p>
                      {service.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{service.description}</p>
                      )}
                      <div className="mt-5 flex items-center justify-between border-t border-line pt-4 font-mono text-xs text-ink-faint">
                        <span>{formatDuration(service.duration_minutes)}</span>
                        <span className="text-accent-dark">{formatCurrency(service.price)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
          <Link
            to="/services"
            className="mt-8 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-accent-dark sm:hidden"
          >
            View all services <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </section>

      {/* About */}
      <section className="relative overflow-hidden border-b border-gold-soft bg-noir-fade px-6 py-20 text-bone">
        <div className="pattern-barber-stripes pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-6xl gap-12 md:grid-cols-2 md:items-center">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-gold">Our story</p>
            <h2 className="mt-2 font-display text-3xl leading-tight md:text-4xl">
              Precision. Style. <span className="text-gold-gradient">Confidence.</span>
            </h2>
            <p className="mt-5 text-bone-soft">
              We started as a two-chair shop in Davao City with one rule: never rush a haircut.
              That rule still stands. Today our team blends classic barbering technique with
              modern styling, and an online booking system so your time is respected as much as
              ours.
            </p>
            <Button
              variant="outline"
              className="mt-7 border-gold/40! text-gold! hover:bg-gold! hover:text-noir!"
              onClick={() => navigate('/barbers')}
            >
              Meet the Barbers
            </Button>
          </div>
          <div className="border border-gold-soft bg-noir-raised/60 p-8">
            <p className="font-display text-2xl text-bone">Business Hours</p>
            <ul className="mt-5 space-y-3 font-mono text-sm">
              {businessHours.map((row) => (
                <li
                  key={row.day}
                  className="flex items-center justify-between border-b border-bone/10 pb-3 last:border-0"
                >
                  <span className="text-bone-soft">{row.day}</span>
                  <span className="text-gold">{row.hours}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Barbers */}
      <section className="border-b border-line px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="flex items-end justify-between">
            <div>
              <p className="font-mono text-xs uppercase tracking-widest text-accent-dark">Meet the team</p>
              <h2 className="mt-2 font-display text-3xl text-ink md:text-4xl">Our Barbers</h2>
            </div>
            <Link
              to="/barbers"
              className="hidden items-center gap-1 text-sm text-ink-soft transition-colors hover:text-accent-dark sm:inline-flex"
            >
              View all <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-10">
            {barbersLoading && <LoadingSpinner label="Loading barbers…" />}
            {barbersError && <ErrorMessage message={barbersError} />}
            {!barbersLoading && !barbersError && barbers && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {barbers.slice(0, 6).map((barber) => (
                  <Card
                    key={barber.id}
                    className="group flex flex-col overflow-hidden border-line transition-all hover:-translate-y-1 hover:border-accent/40 hover:shadow-gold"
                  >
                    <div className="relative aspect-square overflow-hidden">
                      <img
                        src={barberPhoto(barber.id)}
                        alt={barber.name}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-noir/90 to-transparent" />
                    </div>
                    <div className="flex flex-1 flex-col items-center gap-2 p-3 text-center">
                      <p className="font-display text-sm leading-tight text-ink">{barber.name}</p>
                      {barber.specialty && (
                        <p className="font-mono text-[10px] uppercase tracking-wide text-accent-dark">
                          {barber.specialty}
                        </p>
                      )}
                      <Button
                        size="sm"
                        className="mt-auto w-full bg-ink! px-2 py-1.5 text-[11px]! text-canvas! hover:bg-accent-dark!"
                        onClick={() => navigate('/book')}
                      >
                        Book with {barber.name.split(' ')[0]}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden bg-noir-fade px-6 py-24 text-bone">
        <div className="pattern-barber-stripes pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-3xl text-center">
          <h2 className="font-display text-4xl md:text-5xl">
            Ready for Your <span className="text-gold-gradient">Next Fade?</span>
          </h2>
          <p className="mt-4 text-bone-soft">
            Book your next appointment and experience precision, style, and confidence.
          </p>
          <Button
            size="lg"
            className="mt-9 gap-2 bg-gold! text-noir! hover:bg-gold-bright!"
            onClick={() => navigate('/book')}
          >
            Book Appointment
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </section>
    </div>
  )
}
