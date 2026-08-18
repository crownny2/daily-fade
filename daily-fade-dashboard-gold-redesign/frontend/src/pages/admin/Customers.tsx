import { useEffect, useState } from 'react'
import { Search, Eye, Users, RotateCcw, ChevronLeft, ChevronRight, Phone, Mail, CalendarClock } from 'lucide-react'
import { fetchAdminCustomer, fetchAdminCustomers } from '@/api/admin'
import { extractErrorMessage } from '@/api/client'
import { Modal } from '@/components/admin/Modal'
import { StatusBadge } from '@/components/admin/StatusBadge'
import { PaymentStatusBadge } from '@/components/admin/PaymentStatusBadge'
import { Avatar } from '@/components/admin/Avatar'
import { formatCurrency, formatDate, formatTime } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { AdminCustomer, AdminCustomerDetail, CustomerStatus, PaymentStatus } from '@/types/admin'
import type { AppointmentStatus } from '@/types'

const STATUS_TONE: Record<CustomerStatus, string> = {
  new: 'bg-[var(--admin-info-soft)] text-[var(--admin-info)]',
  active: 'bg-[var(--admin-success-soft)] text-[var(--admin-success)]',
  inactive: 'bg-[var(--admin-surface-alt)] text-[var(--admin-text-muted)]',
}

const STATUS_LABEL: Record<CustomerStatus, string> = {
  new: 'New',
  active: 'Active',
  inactive: 'Inactive',
}

function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium', STATUS_TONE[status])}>
      {STATUS_LABEL[status]}
    </span>
  )
}

export function AdminCustomers() {
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  const [customers, setCustomers] = useState<AdminCustomer[]>([])
  const [meta, setMeta] = useState<{ current_page: number; last_page: number; total: number } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [viewingId, setViewingId] = useState<number | null>(null)
  const [viewing, setViewing] = useState<AdminCustomerDetail | null>(null)
  const [isViewLoading, setIsViewLoading] = useState(false)
  const [viewError, setViewError] = useState<string | null>(null)
  const [viewTick, setViewTick] = useState(0)

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
    fetchAdminCustomers({ search: search || undefined, page })
      .then((res) => {
        setCustomers(res.data ?? [])
        setMeta(res.meta ? { current_page: res.meta.current_page, last_page: res.meta.last_page, total: res.meta.total } : null)
      })
      .catch((err) => setError(extractErrorMessage(err, 'Could not load customers.')))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, page])

  useEffect(() => {
    if (viewingId === null) return
    setIsViewLoading(true)
    setViewError(null)
    fetchAdminCustomer(viewingId)
      .then((data) => setViewing(data))
      .catch((err) => setViewError(extractErrorMessage(err, 'Could not load this customer.')))
      .finally(() => setIsViewLoading(false))
  }, [viewingId, viewTick])

  const resetFilters = () => {
    setSearchInput('')
    setSearch('')
    setPage(1)
  }

  const hasFilters = Boolean(search)

  const closeModal = () => {
    setViewingId(null)
    setViewing(null)
    setViewError(null)
    setViewTick(0)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">Customers</h2>
          <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
            {meta ? `${meta.total} total customer${meta.total === 1 ? '' : 's'}` : 'Browse customers and their booking history.'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div
        className="flex flex-col gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 sm:flex-row sm:flex-wrap sm:items-center"
        style={{ boxShadow: 'var(--admin-shadow)' }}
      >
        <div className="flex min-w-[220px] flex-1 items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2">
          <Search className="h-4 w-4 shrink-0 text-[var(--admin-text-subtle)]" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by name, email, or phone..."
            className="w-full bg-transparent text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-subtle)]"
          />
        </div>

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
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Appointments</th>
                <th className="px-4 py-3 font-medium">Last Appointment</th>
                <th className="px-4 py-3 font-medium">Total Spent</th>
                <th className="px-4 py-3 font-medium">Status</th>
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

              {!isLoading && customers.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Users className="h-8 w-8 text-[var(--admin-text-subtle)]" />
                      <p className="text-sm text-[var(--admin-text-muted)]">
                        {hasFilters ? 'No customers match this search.' : 'No customers yet.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-[var(--admin-surface-alt)]/60">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={customer.name} size="sm" />
                        <span className="font-medium text-[var(--admin-text)]">{customer.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[var(--admin-text-muted)]">{customer.email}</td>
                    <td className="px-4 py-4 text-[var(--admin-text-muted)]">{customer.phone ?? '—'}</td>
                    <td className="px-4 py-4 text-[var(--admin-text)]">{customer.total_appointments}</td>
                    <td className="px-4 py-4 text-[var(--admin-text-muted)]">
                      {customer.last_appointment ? formatDate(customer.last_appointment.slice(0, 10)) : '—'}
                    </td>
                    <td className="px-4 py-4 text-[var(--admin-text)]">{formatCurrency(customer.total_spent)}</td>
                    <td className="px-4 py-4">
                      <CustomerStatusBadge status={customer.status} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="View details"
                          onClick={() => setViewingId(customer.id)}
                          className="rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-alt)] hover:text-[var(--admin-text)]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
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

      {/* Customer detail modal */}
      {viewingId !== null && (
        <Modal title={viewing ? viewing.name : 'Customer'} onClose={closeModal} maxWidth="max-w-2xl">
          {isViewLoading && (
            <div className="space-y-3 py-2">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-[var(--admin-surface-alt)]" />
              ))}
            </div>
          )}

          {!isViewLoading && viewError && (
            <div className="flex items-center justify-between rounded-lg bg-[var(--admin-danger-soft)] px-3 py-2.5 text-sm text-[var(--admin-danger)]">
              <span>{viewError}</span>
              <button
                type="button"
                onClick={() => setViewTick((t) => t + 1)}
                className="font-medium underline underline-offset-2"
              >
                Retry
              </button>
            </div>
          )}

          {!isViewLoading && !viewError && viewing && (
            <div className="space-y-5">
              {/* Header with avatar */}
              <div className="flex items-center gap-3">
                <Avatar name={viewing.name} size="lg" />
                <div>
                  <p className="text-base font-semibold text-[var(--admin-text)]">{viewing.name}</p>
                  <CustomerStatusBadge status={viewing.status} />
                </div>
              </div>

              {/* Contact + stats summary */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm text-[var(--admin-text-muted)]">
                  <Mail className="h-4 w-4 shrink-0" />
                  {viewing.email}
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--admin-text-muted)]">
                  <Phone className="h-4 w-4 shrink-0" />
                  {viewing.phone ?? '—'}
                </div>
                <div className="flex items-center gap-2 text-sm text-[var(--admin-text-muted)] sm:col-span-2">
                  <CalendarClock className="h-4 w-4 shrink-0" />
                  Last visit: {viewing.last_appointment ? formatDate(viewing.last_appointment.slice(0, 10)) : '—'}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-3">
                  <p className="text-xs text-[var(--admin-text-muted)]">Total Appointments</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--admin-text)]">{viewing.total_appointments}</p>
                </div>
                <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-3">
                  <p className="text-xs text-[var(--admin-text-muted)]">Total Spent</p>
                  <p className="mt-1 text-lg font-semibold text-[var(--admin-text)]">{formatCurrency(viewing.total_spent)}</p>
                </div>
              </div>

              {/* Appointment history */}
              <div>
                <h4 className="mb-2 text-sm font-semibold text-[var(--admin-text)]">Appointment History</h4>
                {viewing.appointments.length === 0 ? (
                  <p className="rounded-lg border border-dashed border-[var(--admin-border)] px-3 py-6 text-center text-sm text-[var(--admin-text-muted)]">
                    No appointments yet.
                  </p>
                ) : (
                  <div className="max-h-80 overflow-y-auto rounded-lg border border-[var(--admin-border)]">
                    <table className="w-full min-w-[640px] text-left text-xs">
                      <thead className="sticky top-0 border-b border-[var(--admin-border)] bg-[var(--admin-surface-alt)] uppercase tracking-wide text-[var(--admin-text-muted)]">
                        <tr>
                          <th className="px-3 py-2 font-medium">Ref</th>
                          <th className="px-3 py-2 font-medium">Service</th>
                          <th className="px-3 py-2 font-medium">Barber</th>
                          <th className="px-3 py-2 font-medium">Date/Time</th>
                          <th className="px-3 py-2 font-medium">Price</th>
                          <th className="px-3 py-2 font-medium">Status</th>
                          <th className="px-3 py-2 font-medium">Payment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--admin-border)]">
                        {viewing.appointments.map((appt) => (
                          <tr key={appt.id}>
                            <td className="px-3 py-2 font-mono text-[var(--admin-text)]">{appt.booking_reference ?? '—'}</td>
                            <td className="px-3 py-2 text-[var(--admin-text)]">{appt.service ?? '—'}</td>
                            <td className="px-3 py-2 text-[var(--admin-text-muted)]">{appt.barber ?? '—'}</td>
                            <td className="px-3 py-2 text-[var(--admin-text-muted)]">
                              {appt.appointment_date ? formatDate(appt.appointment_date) : '—'}
                              {appt.start_time ? `, ${formatTime(appt.start_time)}` : ''}
                            </td>
                            <td className="px-3 py-2 text-[var(--admin-text)]">{formatCurrency(appt.price)}</td>
                            <td className="px-3 py-2">
                              <StatusBadge status={appt.status as AppointmentStatus} />
                            </td>
                            <td className="px-3 py-2">
                              <PaymentStatusBadge status={appt.payment_status as PaymentStatus} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}
