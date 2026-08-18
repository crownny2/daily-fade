import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { cancelAppointment, fetchAppointment } from '@/api/appointments'
import { useFetch } from '@/hooks/useFetch'
import { useToast } from '@/hooks/useToast'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { ErrorMessage } from '@/components/ui/ErrorMessage'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { extractErrorMessage } from '@/api/client'
import { formatCurrency, formatDate, formatTime, paymentMethodLabel, statusLabel } from '@/utils/format'
import { statusTone, paymentStatusTone } from '@/utils/statusTone'

export function AppointmentDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  const [isCancelling, setIsCancelling] = useState(false)

  const { data: appointment, isLoading, error, refetch } = useFetch(
    () => fetchAppointment(id as string),
    [id]
  )

  const canCancel = appointment && !['completed', 'cancelled', 'no_show'].includes(appointment.status)

  const handleCancel = async () => {
    if (!appointment) return
    setIsCancelling(true)
    try {
      await cancelAppointment(appointment.id)
      showToast('Appointment cancelled.', 'success')
      setIsCancelModalOpen(false)
      refetch()
    } catch (err) {
      showToast(extractErrorMessage(err, 'Could not cancel this appointment.'), 'error')
    } finally {
      setIsCancelling(false)
    }
  }

  if (isLoading) return <LoadingSpinner label="Loading appointment…" />
  if (error) return <ErrorMessage message={error} onRetry={refetch} />
  if (!appointment) return null

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <button onClick={() => navigate('/my-appointments')} className="text-sm text-ink-soft hover:text-accent cursor-pointer">
        ← Back to appointments
      </button>

      <div className="mt-6 flex items-center justify-between">
        <h1 className="font-display text-3xl text-ink">{appointment.service?.name}</h1>
        <Badge tone={statusTone(appointment.status)}>{statusLabel(appointment.status)}</Badge>
      </div>

      <div className="mt-8 border border-line bg-canvas-raised p-6">
        <div className="flex items-center justify-between border-b border-line pb-4">
          <span className="font-mono text-xs uppercase tracking-widest text-ink-faint">Booking Ref.</span>
          <span className="font-mono text-sm text-ink">{appointment.booking_reference}</span>
        </div>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-soft">Barber</dt>
            <dd className="font-medium text-ink">{appointment.barber?.name}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Date</dt>
            <dd className="font-medium text-ink">{formatDate(appointment.appointment_date)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-soft">Time</dt>
            <dd className="font-medium text-ink">
              {formatTime(appointment.start_time)} – {formatTime(appointment.end_time)}
            </dd>
          </div>
          {appointment.service?.price !== undefined && (
            <div className="flex justify-between">
              <dt className="text-ink-soft">Price</dt>
              <dd className="font-mono font-medium text-accent-dark">{formatCurrency(appointment.service.price)}</dd>
            </div>
          )}
          {appointment.payment && (
            <>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Payment Method</dt>
                <dd className="font-medium text-ink">{paymentMethodLabel(appointment.payment.method)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-soft">Payment Status</dt>
                <dd>
                  <Badge tone={paymentStatusTone(appointment.payment.status)}>
                    {statusLabel(appointment.payment.status)}
                  </Badge>
                </dd>
              </div>
              {appointment.payment.transaction_reference && (
                <div className="flex justify-between">
                  <dt className="text-ink-soft">Reference No.</dt>
                  <dd className="font-mono text-xs text-ink">{appointment.payment.transaction_reference}</dd>
                </div>
              )}
            </>
          )}
          {appointment.notes && (
            <div className="flex justify-between gap-6">
              <dt className="shrink-0 text-ink-soft">Notes</dt>
              <dd className="text-right text-ink">{appointment.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      {canCancel && (
        <Button variant="outline" className="mt-8 border-danger text-danger hover:bg-danger hover:text-canvas" onClick={() => setIsCancelModalOpen(true)}>
          Cancel Appointment
        </Button>
      )}

      <Modal isOpen={isCancelModalOpen} onClose={() => setIsCancelModalOpen(false)} title="Cancel this appointment?">
        <p className="text-sm text-ink-soft">This can't be undone. You'll need to book a new slot if you change your mind.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)}>
            Keep It
          </Button>
          <Button
            className="bg-danger text-canvas hover:bg-danger/90"
            isLoading={isCancelling}
            onClick={handleCancel}
          >
            Yes, Cancel
          </Button>
        </div>
      </Modal>
    </div>
  )
}
