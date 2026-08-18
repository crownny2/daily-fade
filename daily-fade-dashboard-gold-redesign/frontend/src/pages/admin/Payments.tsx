import { useEffect, useState, type FormEvent } from 'react'
import {
  Search,
  Eye,
  CheckCircle2,
  XCircle,
  Undo2,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Wallet,
} from 'lucide-react'
import { fetchAdminPayments, updatePaymentStatus } from '@/api/admin'
import { extractErrorMessage } from '@/api/client'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/admin/Modal'
import { PaymentStatusBadge } from '@/components/admin/PaymentStatusBadge'
import { Avatar } from '@/components/admin/Avatar'
import { formatCurrency, formatDate, formatTime, statusLabel } from '@/utils/format'
import type { AdminPayment, PaymentMethod, PaymentStatus } from '@/types/admin'

const STATUS_OPTIONS: { value: PaymentStatus | ''; label: string }[] = [
  { value: '', label: 'All statuses' },
  { value: 'pending', label: 'Pending' },
  { value: 'paid', label: 'Paid' },
  { value: 'failed', label: 'Failed' },
  { value: 'refunded', label: 'Refunded' },
]

const METHOD_OPTIONS: { value: PaymentMethod | ''; label: string }[] = [
  { value: '', label: 'All methods' },
  { value: 'cash', label: 'Cash' },
  { value: 'gcash', label: 'GCash' },
  { value: 'maya', label: 'Maya' },
]

type StatusChangeTarget = 'paid' | 'failed' | 'refunded'

const TARGET_LABEL: Record<StatusChangeTarget, string> = {
  paid: 'Mark as Paid',
  failed: 'Mark as Failed',
  refunded: 'Mark as Refunded',
}

const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'Cash',
  gcash: 'GCash',
  maya: 'Maya',
}

export function AdminPayments() {
  const { showToast } = useToast()

  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<PaymentStatus | ''>('')
  const [method, setMethod] = useState<PaymentMethod | ''>('')
  const [page, setPage] = useState(1)

  const [payments, setPayments] = useState<AdminPayment[]>([])
  const [meta, setMeta] = useState<{ current_page: number; last_page: number; total: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [viewing, setViewing] = useState<AdminPayment | null>(null)

  const [pendingChange, setPendingChange] = useState<{ payment: AdminPayment; target: StatusChangeTarget } | null>(null)
  const [changeMethod, setChangeMethod] = useState<PaymentMethod>('cash')
  const [changeReference, setChangeReference] = useState('')
  const [changeNotes, setChangeNotes] = useState('')
  const [changeError, setChangeError] = useState<string | null>(null)
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
    fetchAdminPayments({
      search: search || undefined,
      status: status || undefined,
      method: method || undefined,
      page,
    })
      .then((res) => {
        setPayments(res.data ?? [])
        setMeta(res.meta ? { current_page: res.meta.current_page, last_page: res.meta.last_page, total: res.meta.total } : null)
      })
      .catch((err) => setError(extractErrorMessage(err, 'Could not load payments.')))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, status, method, page])

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setStatus('')
    setMethod('')
    setPage(1)
  }

  const hasFilters = Boolean(search || status || method)

  const openStatusChange = (payment: AdminPayment, target: StatusChangeTarget) => {
    setPendingChange({ payment, target })
    setChangeMethod(payment.method === 'maya' || payment.method === 'gcash' ? payment.method : 'cash')
    setChangeReference(payment.transaction_reference ?? '')
    setChangeNotes('')
    setChangeError(null)
  }

  const submitStatusChange = async (e: FormEvent) => {
    e.preventDefault()
    if (!pendingChange) return
    setChangeError(null)
    setIsSubmitting(true)
    try {
      const updated = await updatePaymentStatus(pendingChange.payment.id, {
        status: pendingChange.target,
        method: pendingChange.target === 'paid' ? changeMethod : undefined,
        transaction_reference: pendingChange.target === 'paid' ? changeReference.trim() || undefined : undefined,
        notes: changeNotes.trim() || undefined,
      })
      setPayments((current) => current.map((p) => (p.id === updated.id ? updated : p)))
      showToast(`Payment for ${updated.booking_reference} ${statusLabel(updated.status).toLowerCase()}.`, 'success')
      setPendingChange(null)
    } catch (err) {
      setChangeError(extractErrorMessage(err, 'Could not update payment status.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const actionsFor = (payment: AdminPayment) => {
    if (payment.status === 'pending') {
      return [
        { target: 'paid' as const, icon: CheckCircle2, tone: 'text-[var(--admin-success)] hover:bg-[var(--admin-success-soft)]' },
        { target: 'failed' as const, icon: XCircle, tone: 'text-[var(--admin-danger)] hover:bg-[var(--admin-danger-soft)]' },
      ]
    }
    if (payment.status === 'paid') {
      return [{ target: 'refunded' as const, icon: Undo2, tone: 'text-[var(--admin-info)] hover:bg-[var(--admin-info-soft)]' }]
    }
    return []
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">Payments</h2>
          <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
            {meta ? `${meta.total} total payment${meta.total === 1 ? '' : 's'}` : 'Track and record payments for bookings.'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 sm:flex-row sm:flex-wrap sm:items-center" style={{ boxShadow: 'var(--admin-shadow)' }}>
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[var(--admin-text-subtle)]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search booking reference or customer..."
            className="w-full bg-transparent text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-subtle)]"
          />
        </div>

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as PaymentStatus | '')
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

        <select
          value={method}
          onChange={(e) => {
            setMethod(e.target.value as PaymentMethod | '')
            setPage(1)
          }}
          className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none"
        >
          {METHOD_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

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
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-alt)] text-xs uppercase tracking-wide text-[var(--admin-text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Booking Ref</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Payment Date</th>
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

              {!isLoading && payments.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Wallet className="h-8 w-8 text-[var(--admin-text-subtle)]" />
                      <p className="text-sm text-[var(--admin-text-muted)]">
                        {hasFilters ? 'No payments match these filters.' : 'No payments recorded yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-[var(--admin-surface-alt)]/60">
                    <td className="px-4 py-4 font-mono text-xs text-[var(--admin-text)]">{payment.booking_reference}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2.5">
                        {payment.customer?.name && <Avatar name={payment.customer.name} size="sm" />}
                        <span className="text-[var(--admin-text)]">{payment.customer?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[var(--admin-text)]">{payment.service?.name ?? '—'}</td>
                    <td className="px-4 py-4 font-semibold text-[var(--admin-text)]">{formatCurrency(payment.amount)}</td>
                    <td className="px-4 py-4 text-[var(--admin-text-muted)]">{METHOD_LABELS[payment.method]}</td>
                    <td className="px-4 py-4">
                      <PaymentStatusBadge status={payment.status} />
                    </td>
                    <td className="px-4 py-4 text-[var(--admin-text-muted)]">
                      {payment.paid_at ? formatDate(payment.paid_at.slice(0, 10)) : '—'}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="View details"
                          onClick={() => setViewing(payment)}
                          className="rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-alt)] hover:text-[var(--admin-text)]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {actionsFor(payment).map((action) => (
                          <button
                            key={action.target}
                            type="button"
                            title={TARGET_LABEL[action.target]}
                            onClick={() => openStatusChange(payment, action.target)}
                            className={`rounded-lg p-1.5 ${action.tone}`}
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
        <Modal title={`Payment · ${viewing.booking_reference}`} onClose={() => setViewing(null)} maxWidth="max-w-lg">
          <div className="space-y-3 text-sm">
            {viewing.customer?.name && (
              <div className="mb-2 flex items-center gap-3 border-b border-[var(--admin-border)] pb-4">
                <Avatar name={viewing.customer.name} size="lg" />
                <div>
                  <p className="text-base font-semibold text-[var(--admin-text)]">{viewing.customer.name}</p>
                  <p className="text-xs text-[var(--admin-text-muted)]">{viewing.booking_reference}</p>
                </div>
              </div>
            )}
            <Row label="Booking Reference" value={viewing.booking_reference ?? '—'} />
            <Row label="Customer" value={viewing.customer?.name ?? '—'} />
            <Row label="Barber" value={viewing.barber?.name ?? '—'} />
            <Row label="Service" value={viewing.service?.name ?? '—'} />
            <Row label="Appointment Date" value={viewing.appointment_date ? formatDate(viewing.appointment_date) : '—'} />
            <Row label="Appointment Time" value={viewing.start_time ? formatTime(viewing.start_time) : '—'} />
            <Row label="Amount" value={formatCurrency(viewing.amount)} />
            <Row label="Payment Method" value={METHOD_LABELS[viewing.method]} />
            <div className="flex items-center justify-between border-b border-[var(--admin-border)] py-1.5">
              <span className="text-[var(--admin-text-muted)]">Payment Status</span>
              <PaymentStatusBadge status={viewing.status} />
            </div>
            <Row label="Transaction Reference" value={viewing.transaction_reference || '—'} />
            <Row label="Paid Date" value={viewing.paid_at ? formatDate(viewing.paid_at.slice(0, 10)) : '—'} />
            {viewing.notes && (
              <div className="border-t border-[var(--admin-border)] pt-3">
                <p className="mb-1 text-xs font-medium uppercase tracking-wide text-[var(--admin-text-muted)]">Notes</p>
                <p className="text-[var(--admin-text)]">{viewing.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Status change modal */}
      {pendingChange && (
        <Modal title={`${TARGET_LABEL[pendingChange.target]}?`} onClose={() => setPendingChange(null)}>
          <form onSubmit={submitStatusChange} className="space-y-4">
            <p className="text-sm text-[var(--admin-text-muted)]">
              {pendingChange.target === 'paid' &&
                `Confirm payment method for booking ${pendingChange.payment.booking_reference}.`}
              {pendingChange.target === 'failed' &&
                `This marks the payment for ${pendingChange.payment.booking_reference} as failed. No money is moved automatically.`}
              {pendingChange.target === 'refunded' &&
                `This marks the payment for ${pendingChange.payment.booking_reference} as refunded. No money is moved automatically — record the refund status only.`}
            </p>

            {pendingChange.target === 'paid' && (
              <>
                <label className="block">
                  <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">Payment Method</span>
                  <select
                    value={changeMethod}
                    onChange={(e) => setChangeMethod(e.target.value as PaymentMethod)}
                    className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
                  >
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                    <option value="maya">Maya</option>
                  </select>
                </label>

                {changeMethod !== 'cash' && (
                  <label className="block">
                    <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">
                      Transaction Reference (optional)
                    </span>
                    <input
                      value={changeReference}
                      onChange={(e) => setChangeReference(e.target.value)}
                      className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
                      placeholder="e.g. GC-2026-00931"
                    />
                  </label>
                )}
              </>
            )}

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">Notes (optional)</span>
              <textarea
                value={changeNotes}
                onChange={(e) => setChangeNotes(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
                placeholder="Optional"
              />
            </label>

            {changeError && (
              <div className="rounded-lg bg-[var(--admin-danger-soft)] px-3 py-2.5 text-sm text-[var(--admin-danger)]">
                {changeError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setPendingChange(null)}
                className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-medium text-[var(--admin-text)] hover:bg-[var(--admin-surface-alt)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={
                  pendingChange.target === 'failed'
                    ? 'flex items-center gap-2 rounded-lg bg-[var(--admin-danger)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60'
                    : 'flex items-center gap-2 rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--admin-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60'
                }
              >
                {isSubmitting && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {TARGET_LABEL[pendingChange.target]}
              </button>
            </div>
          </form>
        </Modal>
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
