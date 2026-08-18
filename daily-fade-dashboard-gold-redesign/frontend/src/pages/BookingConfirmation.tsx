import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Check, Scissors, User, CalendarDays, Clock, FileText, Wallet, Info } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { formatCurrency, formatDate, formatTime, paymentMethodLabel, statusLabel } from '@/utils/format'
import { paymentStatusTone, statusTone } from '@/utils/statusTone'
import { HERO_IMAGE_URL } from '@/utils/media'
import type { Appointment } from '@/types'

function DetailRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Scissors
  label: string
  children: ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line py-3.5 last:border-b-0">
      <dt className="flex items-center gap-3 text-sm text-ink-soft">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft/40 text-accent-dark">
          <Icon className="h-4 w-4" strokeWidth={1.75} />
        </span>
        {label}
      </dt>
      <dd className="text-right text-sm font-medium text-ink">{children}</dd>
    </div>
  )
}

export function BookingConfirmation() {
  const location = useLocation()
  const navigate = useNavigate()
  const appointment = (location.state as { appointment?: Appointment } | null)?.appointment

  if (!appointment) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center">
        <p className="font-display text-2xl text-ink">No booking to show</p>
        <p className="mt-2 text-ink-soft">Start a new booking to see your confirmation here.</p>
        <Button className="mt-8" onClick={() => navigate('/book')}>
          Book an Appointment
        </Button>
      </div>
    )
  }

  return (
    <div>
      {/* Dark premium band, same noir/gold surface as the rest of the booking flow. */}
      <section className="relative overflow-hidden px-6 py-16 text-center text-bone">
        <img src={HERO_IMAGE_URL} alt="" className="absolute inset-0 h-full w-full object-cover" aria-hidden="true" />
        <div className="absolute inset-0 bg-noir/85" aria-hidden="true" />
        <div className="pattern-barber-stripes pointer-events-none absolute inset-0" aria-hidden="true" />
        <div className="relative mx-auto max-w-lg">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-gold bg-gold/10 text-gold">
            <Check className="h-6 w-6" strokeWidth={2} />
          </span>
          <h1 className="mt-5 font-display text-3xl text-bone">
            You&rsquo;re all <span className="text-gold-gradient">booked</span> in!
          </h1>
          <p className="mt-2 text-bone-soft">A confirmation has been saved to your account.</p>
        </div>
      </section>

      <div className="mx-auto max-w-lg px-6 py-14">
        <Card className="p-6">
          <div className="flex items-center justify-between border-b border-line pb-4">
            <span className="font-mono text-xs uppercase tracking-widest text-ink-faint">Booking Ref.</span>
            <span className="font-mono text-sm text-ink">{appointment.booking_reference}</span>
          </div>
          <dl className="mt-1">
            <DetailRow icon={Scissors} label="Service">{appointment.service?.name}</DetailRow>
            <DetailRow icon={User} label="Barber">{appointment.barber?.name}</DetailRow>
            <DetailRow icon={CalendarDays} label="Date">{formatDate(appointment.appointment_date)}</DetailRow>
            <DetailRow icon={Clock} label="Time">
              {formatTime(appointment.start_time)} – {formatTime(appointment.end_time)}
            </DetailRow>
            <DetailRow icon={FileText} label="Status">
              <Badge tone={statusTone(appointment.status)}>{statusLabel(appointment.status)}</Badge>
            </DetailRow>
            {appointment.payment && (
              <>
                <DetailRow icon={Wallet} label="Payment Method">
                  {paymentMethodLabel(appointment.payment.method)}
                </DetailRow>
                <DetailRow icon={Info} label="Payment Status">
                  <Badge tone={paymentStatusTone(appointment.payment.status)}>
                    {statusLabel(appointment.payment.status)}
                  </Badge>
                </DetailRow>
              </>
            )}
          </dl>
          {appointment.service?.price !== undefined && (
            <div className="mt-4 flex items-center justify-between rounded-xl bg-accent-soft/30 px-4 py-4">
              <span className="font-display text-base text-ink">Total</span>
              <span className="font-mono text-xl font-medium text-accent-dark">
                {formatCurrency(appointment.service.price)}
              </span>
            </div>
          )}
        </Card>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button className="flex-1" onClick={() => navigate('/my-appointments')}>
            View My Appointments
          </Button>
          <Link to="/" className="flex-1">
            <Button variant="outline" className="w-full">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
