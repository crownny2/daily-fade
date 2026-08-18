import { Link, useNavigate } from 'react-router-dom'
import { fetchMyAppointments } from '@/api/appointments'
import { useFetch } from '@/hooks/useFetch'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { EmptyState } from '@/components/ui/EmptyState'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency, formatDate, formatTime, paymentMethodLabel, statusLabel } from '@/utils/format'
import { statusTone, paymentStatusTone } from '@/utils/statusTone'

export function MyAppointments() {
  const { data: appointments, isLoading, error, refetch } = useFetch(fetchMyAppointments)
  const navigate = useNavigate()

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-accent-dark">Your bookings</p>
          <h1 className="mt-2 font-display text-4xl text-ink">My Appointments</h1>
        </div>
        <Button size="sm" onClick={() => navigate('/book')} className="hidden sm:inline-flex">
          Book New
        </Button>
      </div>

      <div className="mt-10">
        {isLoading && <LoadingSpinner label="Loading your appointments…" />}
        {error && <ErrorMessage message={error} onRetry={refetch} />}
        {!isLoading && !error && (!appointments || appointments.length === 0) && (
          <EmptyState
            title="No appointments yet"
            description="Once you book, your appointments will show up here."
            action={<Button onClick={() => navigate('/book')}>Book an Appointment</Button>}
          />
        )}
        {!isLoading && !error && appointments && appointments.length > 0 && (
          <div className="flex flex-col gap-4">
            {appointments.map((appt) => (
              <Link key={appt.id} to={`/my-appointments/${appt.id}`}>
                <Card className="flex flex-col gap-2 p-5 hover:border-ink/40 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-mono text-xs uppercase tracking-widest text-ink-faint">
                      {appt.booking_reference}
                    </p>
                    <p className="mt-1 font-display text-lg text-ink">{appt.service?.name}</p>
                    <p className="mt-1 text-sm text-ink-soft">
                      with {appt.barber?.name} · {formatDate(appt.appointment_date)} at {formatTime(appt.start_time)}
                    </p>
                    {appt.service?.price !== undefined && (
                      <p className="mt-1 font-mono text-sm text-accent-dark">
                        {formatCurrency(appt.service.price)}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-row gap-2 sm:flex-col sm:items-end">
                    <Badge tone={statusTone(appt.status)}>{statusLabel(appt.status)}</Badge>
                    {appt.payment && (
                      <div className="flex items-center gap-1.5 sm:flex-col sm:items-end sm:gap-1">
                        <span className="font-mono text-[11px] uppercase tracking-wide text-ink-faint">
                          {paymentMethodLabel(appt.payment.method)}
                        </span>
                        <Badge tone={paymentStatusTone(appt.payment.status)}>
                          {statusLabel(appt.payment.status)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
