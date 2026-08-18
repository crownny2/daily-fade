import { useEffect, useMemo, useState } from 'react'
import { Search, Eye, Check, CheckCheck, Ban, UserX, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react'
import { fetchBarberAppointments, updateBarberAppointmentStatus } from '@/api/barber'
import { extractErrorMessage } from '@/api/client'
import { useToast } from '@/hooks/useToast'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { PaymentStatusBadge } from '@/components/admin/PaymentStatusBadge'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Modal } from '@/components/admin/Modal'
import { formatCurrency, formatDate, formatDuration, formatTime } from '@/utils/format'
import type { Appointment, AppointmentStatus } from '@/types'
import type { PaymentStatus } from '@/types/admin'

const STATUS_OPTIONS: { value: AppointmentStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'no_show', label: 'No Show' },
]

type PendingAction = {
  appointment: Appointment
  status: AppointmentStatus
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
}

/**
 * Same filter/table/modal/confirm shape as Api\Admin's Appointments page
 * (reusing StatusBadge, PaymentStatusBadge, Modal, ConfirmDialog directly)
 * minus the barber filter, since the backend already scopes everything to
 * the logged-in barber — there's nothing else to filter by.
 */
export function BarberAppointments() {
  const { showToast } = useToast()

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<AppointmentStatus | ''>('')
  const [date, setDate] = useState('')
  const [page, setPage] = useState(1)

  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [meta, setMeta] = useState<{ current_page: number; last_page: number; total: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [viewing, setViewing] = useState<Appointment | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput)
      setPage(1)
    }, 400)
    return () => clearTimeout(t)
  }, [searchInput])

  const load = () => {
    setIsLoading(true)
    setError(null)
    fetchBarberAppointments({
      search: search || undefined,
      status: status || undefined,
      date: date || undefined,
      page,
    })
      .then((res) => {
        setAppointments(res.data ?? [])
        setMeta(res.meta ? { current_page: res.meta.current_page, last_page: res.meta.last_page, total: res.meta.total } : null)
      })
      .catch((err) => setError(extractErrorMessage(err, 'Could not load appointments.')))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, date, page])

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setStatus('')
    setDate('')
    setPage(1)
  }

  const applyStatusUpdate = async () => {
    if (!pendingAction) return
    setIsSubmitting(true)
    try {
      const updated = await updateBarberAppointmentStatus(pendingAction.appointment.id, pendingAction.status)
      setAppointments((current) => current.map((a) => (a.id === updated.id ? updated : a)))
      if (viewing?.id === updated.id) setViewing(updated)
      showToast(`Appointment ${updated.booking_reference} marked as ${pendingAction.status.replace('_', ' ')}.`, 'success')
      setPendingAction(null)
    } catch (err) {
      showToast(extractErrorMessage(err, 'Could not update appointment status.'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const actionsFor = (appt: Appointment) => {
    const actions: { label: string; icon: typeof Check; status: AppointmentStatus; danger?: boolean }[] = []
    if (appt.status === 'pending') {
      actions.push({ label: 'Confirm', icon: Check, status: 'confirmed' })
      actions.push({ label: 'Cancel', icon: Ban, status: 'cancelled', danger: true })
    } else if (appt.status === 'confirmed') {
      actions.push({ label: 'Complete', icon: CheckCheck, status: 'completed' })
      actions.push({ label: 'No-show', icon: UserX, status: 'no_show', danger: true })
      actions.push({ label: 'Cancel', icon: Ban, status: 'cancelled', danger: true })
    }
    return actions
  }

  const askConfirm = (appt: Appointment, statusValue: AppointmentStatus, label: string, danger?: boolean) => {
    setPendingAction({
      appointment: appt,
      status: statusValue,
      title: `${label} appointment?`,
      message: `This will mark booking ${appt.booking_reference} as "${statusValue.replace('_', ' ')}". This action updates the record immediately.`,
      confirmLabel: label,
      danger,
    })
  }

  const hasFilters = useMemo(() => search || status || date, [search, status, date])

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">My Appointments</h2>
          <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
            {meta ? `${meta.total} total appointment${meta.total === 1 ? '' : 's'}` : 'Appointments assigned to you.'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div
        className="flex flex-col gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 sm:flex-row sm:flex-wrap sm:items-center"
        style={{ boxShadow: 'var(--admin-shadow)' }}
      >
        <div className="flex min-w-[200px] flex-1 items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[var(--admin-text-subtle)]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search customer or booking ref..."
            className="w-full bg-transparent text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-subtle)]"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as AppointmentStatus | '')
            setPage(1)
          }}
          className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={date}
          onChange={(e) => {
            setDate(e.target.value)
            setPage(1)
          }}
          className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none"
        />

        {hasFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-alt)]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-[var(--admin-danger)]/30 bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]">
          <span>{error}</span>
          <button type="button" onClick={load} className="font-medium underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]" style={{ boxShadow: 'var(--admin-shadow)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] text-left text-sm">
            <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-alt)] text-xs uppercase tracking-wide text-[var(--admin-text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Booking Ref</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {isLoading &&
                [0, 1, 2, 3].map((i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-4">
                      <div className="h-5 animate-pulse rounded bg-[var(--admin-surface-alt)]" />
                    </td>
                  </tr>
                ))}

              {!isLoading && appointments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-[var(--admin-text-muted)]">
                    No appointments match these filters.
                  </td>
                </tr>
              )}

              {!isLoading &&
                appointments.map((appt) => (
                  <tr key={appt.id} className="hover:bg-[var(--admin-surface-alt)]/60">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--admin-text)]">{appt.booking_reference}</td>
                    <td className="px-4 py-3 text-[var(--admin-text)]">{appt.customer?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--admin-text)]">{appt.service?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--admin-text-muted)]">{formatDate(appt.appointment_date)}</td>
                    <td className="px-4 py-3 text-[var(--admin-text-muted)]">{formatTime(appt.start_time)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={appt.status} />
                    </td>
                    <td className="px-4 py-3">
                      {appt.payment ? (
                        <PaymentStatusBadge status={appt.payment.status as PaymentStatus} />
                      ) : (
                        <span className="text-xs text-[var(--admin-text-subtle)]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setViewing(appt)}
                          title="View details"
                          className="rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-alt)] hover:text-[var(--admin-text)]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {actionsFor(appt).map((action) => (
                          <button
                            key={action.label}
                            type="button"
                            title={action.label}
                            onClick={() => askConfirm(appt, action.status, action.label, action.danger)}
                            className={
                              action.danger
                                ? 'rounded-lg p-1.5 text-[var(--admin-danger)] hover:bg-[var(--admin-danger-soft)]'
                                : 'rounded-lg p-1.5 text-[var(--admin-success)] hover:bg-[var(--admin-success-soft)]'
                            }
                          >
                            <action.icon className="h-4 w-4" />
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta && meta.last_page > 1 && (
          <div className="flex items-center justify-between border-t border-[var(--admin-border)] px-4 py-3">
            <span className="text-xs text-[var(--admin-text-muted)]">
              Page {meta.current_page} of {meta.last_page}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={meta.current_page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex items-center gap-1 rounded-lg border border-[var(--admin-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--admin-text)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </button>
              <button
                type="button"
                disabled={meta.current_page >= meta.last_page}
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
                className="flex items-center gap-1 rounded-lg border border-[var(--admin-border)] px-2.5 py-1.5 text-xs font-medium text-[var(--admin-text)] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details modal */}
      {viewing && (
        <Modal
          title={`Booking ${viewing.booking_reference}`}
          onClose={() => setViewing(null)}
          maxWidth="max-w-lg"
          footer={
            actionsFor(viewing).length > 0 ? (
              <>
                {actionsFor(viewing).map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    onClick={() => askConfirm(viewing, action.status, action.label, action.danger)}
                    className={
                      action.danger
                        ? 'flex items-center gap-2 rounded-lg border border-[var(--admin-danger)]/40 px-4 py-2 text-sm font-medium text-[var(--admin-danger)] hover:bg-[var(--admin-danger-soft)]'
                        : 'flex items-center gap-2 rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--admin-accent-hover)]'
                    }
                  >
                    <action.icon className="h-4 w-4" />
                    {action.label}
                  </button>
                ))}
              </>
            ) : undefined
          }
        >
          <div className="space-y-3 text-sm">
            <Row label="Customer" value={viewing.customer?.name ?? '—'} />
            <Row label="Service" value={viewing.service?.name ?? '—'} />
            <Row label="Date" value={formatDate(viewing.appointment_date)} />
            <Row label="Time" value={`${formatTime(viewing.start_time)} – ${formatTime(viewing.end_time)}`} />
            <Row label="Duration" value={viewing.service ? formatDuration(viewing.service.duration_minutes) : '—'} />
            <Row label="Price" value={viewing.service ? formatCurrency(viewing.service.price) : '—'} />
            <Row
              label="Payment"
              value={
                viewing.payment
                  ? `${formatCurrency(viewing.payment.amount)} · ${viewing.payment.method} · ${viewing.payment.status}`
                  : 'No payment recorded'
              }
            />
            <div className="flex items-center justify-between py-1.5">
              <span className="text-[var(--admin-text-muted)]">Status</span>
              <StatusBadge status={viewing.status} />
            </div>
            {viewing.notes && (
              <div className="border-t border-[var(--admin-border)] pt-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--admin-text-muted)]">Notes</p>
                <p className="text-[var(--admin-text)]">{viewing.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Confirm status change */}
      {pendingAction && (
        <ConfirmDialog
          title={pendingAction.title}
          message={pendingAction.message}
          confirmLabel={pendingAction.confirmLabel}
          danger={pendingAction.danger}
          isSubmitting={isSubmitting}
          onConfirm={applyStatusUpdate}
          onCancel={() => setPendingAction(null)}
        />
      )}
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[var(--admin-border)] py-1.5 last:border-0">
      <span className="text-[var(--admin-text-muted)]">{label}</span>
      <span className="font-medium text-[var(--admin-text)]">{value}</span>
    </div>
  )
}
