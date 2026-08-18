import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Plus, Search, Pencil, Trash2, Power, Scissors, X } from 'lucide-react'
import {
  createService,
  deleteService,
  fetchAdminServices,
  toggleServiceStatus,
  updateService,
} from '@/api/admin'
import { extractErrorMessage } from '@/api/client'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/admin/Modal'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { formatCurrency, formatDuration } from '@/utils/format'
import type { Service } from '@/types'
import type { ServicePayload } from '@/types/admin'

const emptyForm: ServicePayload = {
  name: '',
  description: '',
  duration_minutes: 30,
  price: 0,
  is_active: true,
}

export function AdminServices() {
  const { showToast } = useToast()

  const [services, setServices] = useState<Service[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')

  const [editing, setEditing] = useState<Service | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<ServicePayload>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [deleting, setDeleting] = useState<Service | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const load = () => {
    setIsLoading(true)
    setError(null)
    fetchAdminServices()
      .then(setServices)
      .catch((err) => setError(extractErrorMessage(err, 'Could not load services.')))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  const filtered = useMemo(
    () =>
      services
        .filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
        .filter((s) => {
          if (statusFilter === 'active') return s.is_active
          if (statusFilter === 'inactive') return !s.is_active
          return true
        }),
    [services, search, statusFilter]
  )

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (service: Service) => {
    setEditing(service)
    setForm({
      name: service.name,
      description: service.description ?? '',
      duration_minutes: service.duration_minutes,
      price: typeof service.price === 'string' ? parseFloat(service.price) : service.price,
      is_active: service.is_active ?? true,
    })
    setFormError(null)
    setShowForm(true)
  }

  const submitForm = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.name.trim()) {
      setFormError('Name is required.')
      return
    }
    if (form.duration_minutes <= 0) {
      setFormError('Duration must be greater than 0.')
      return
    }
    if (form.price < 0) {
      setFormError('Price cannot be negative.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editing) {
        const updated = await updateService(editing.id, form)
        setServices((current) => current.map((s) => (s.id === updated.id ? updated : s)))
        showToast('Service updated.', 'success')
      } else {
        const created = await createService(form)
        setServices((current) => [...current, created])
        showToast('Service created.', 'success')
      }
      setShowForm(false)
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Could not save this service.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleToggle = async (service: Service) => {
    try {
      const updated = await toggleServiceStatus(service.id)
      setServices((current) => current.map((s) => (s.id === updated.id ? updated : s)))
      showToast(updated.is_active ? 'Service activated.' : 'Service deactivated.', 'success')
    } catch (err) {
      showToast(extractErrorMessage(err, 'Could not update service status.'), 'error')
    }
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setIsDeleting(true)
    try {
      const res = await deleteService(deleting.id)
      if (res.data) {
        // Deactivated instead of deleted (had existing appointments)
        setServices((current) => current.map((s) => (s.id === deleting.id ? (res.data as Service) : s)))
      } else {
        setServices((current) => current.filter((s) => s.id !== deleting.id))
      }
      showToast(res.message ?? 'Service removed.', 'success')
      setDeleting(null)
    } catch (err) {
      showToast(extractErrorMessage(err, 'Could not delete this service.'), 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">Services</h2>
          <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
            Manage what customers can book. {!isLoading && `${services.length} total service${services.length === 1 ? '' : 's'}.`}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg bg-[var(--admin-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--admin-accent-hover)]"
        >
          <Plus className="h-4 w-4" />
          Add Service
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2 sm:max-w-xs sm:flex-1">
          <Search className="h-4 w-4 shrink-0 text-[var(--admin-text-subtle)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search services..."
            className="w-full bg-transparent text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-subtle)]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="text-[var(--admin-text-subtle)] hover:text-[var(--admin-text)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-1">
          {(['all', 'active', 'inactive'] as const).map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setStatusFilter(opt)}
              className={
                statusFilter === opt
                  ? 'rounded-md bg-[var(--admin-accent)] px-3 py-1.5 text-xs font-semibold text-white'
                  : 'rounded-md px-3 py-1.5 text-xs font-medium text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
              }
            >
              {opt === 'all' ? 'All' : opt === 'active' ? 'Active' : 'Inactive'}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-[var(--admin-danger)]/30 bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]">
          <span>{error}</span>
          <button type="button" onClick={load} className="font-medium underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]" style={{ boxShadow: 'var(--admin-shadow)' }}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="sticky top-0 z-10 border-b border-[var(--admin-border)] bg-[var(--admin-surface-alt)] text-xs uppercase tracking-wide text-[var(--admin-text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium">Duration</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {isLoading &&
                [0, 1, 2, 3].map((i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((_, col) => (
                      <td key={col} className="px-4 py-4">
                        <div className="h-4 w-full max-w-[8rem] animate-pulse rounded bg-[var(--admin-surface-alt)]" />
                      </td>
                    ))}
                  </tr>
                ))}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <Scissors className="h-8 w-8 text-[var(--admin-text-subtle)]" />
                      <p className="text-sm text-[var(--admin-text-muted)]">
                        {search || statusFilter !== 'all'
                          ? 'No services match your filters.'
                          : 'No services yet. Add your first one.'}
                      </p>
                      {(search || statusFilter !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearch('')
                            setStatusFilter('all')
                          }}
                          className="rounded-lg border border-[var(--admin-border)] px-3 py-1.5 text-xs font-medium text-[var(--admin-text)] hover:bg-[var(--admin-surface-alt)]"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                filtered.map((service) => (
                  <tr key={service.id} className="hover:bg-[var(--admin-surface-alt)]/60">
                    <td className="px-4 py-3 font-medium text-[var(--admin-text)]">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
                          <Scissors className="h-4 w-4" />
                        </span>
                        <span className="truncate">{service.name}</span>
                      </div>
                    </td>
                    <td className="max-w-xs truncate px-4 py-3 text-[var(--admin-text-muted)]">
                      {service.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-[var(--admin-text-muted)]">{formatDuration(service.duration_minutes)}</td>
                    <td className="px-4 py-3 text-[var(--admin-text)]">{formatCurrency(service.price)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          service.is_active
                            ? 'inline-flex items-center rounded-full bg-[var(--admin-success-soft)] px-2.5 py-1 text-xs font-medium text-[var(--admin-success)]'
                            : 'inline-flex items-center rounded-full bg-[var(--admin-surface-alt)] px-2.5 py-1 text-xs font-medium text-[var(--admin-text-muted)]'
                        }
                      >
                        {service.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => openEdit(service)}
                          className="rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-alt)] hover:text-[var(--admin-text)]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title={service.is_active ? 'Deactivate' : 'Activate'}
                          onClick={() => handleToggle(service)}
                          className="rounded-lg p-1.5 text-[var(--admin-info)] hover:bg-[var(--admin-info-soft)]"
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          onClick={() => setDeleting(service)}
                          className="rounded-lg p-1.5 text-[var(--admin-danger)] hover:bg-[var(--admin-danger-soft)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <Modal title={editing ? 'Edit Service' : 'Add Service'} onClose={() => setShowForm(false)}>
          <form onSubmit={submitForm} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">Name</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
                placeholder="e.g. Signature Haircut"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">Description</span>
              <textarea
                value={form.description ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full resize-none rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
                placeholder="Optional"
              />
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">Duration (min)</span>
                <input
                  type="number"
                  min={1}
                  value={form.duration_minutes}
                  onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">Price (₱)</span>
                <input
                  type="number"
                  min={0}
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
                />
              </label>
            </div>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active ?? true}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
                className="h-4 w-4 rounded border-[var(--admin-border)]"
              />
              <span className="text-sm text-[var(--admin-text)]">Active (bookable by customers)</span>
            </label>

            {formError && (
              <div className="rounded-lg bg-[var(--admin-danger-soft)] px-3 py-2.5 text-sm text-[var(--admin-danger)]">
                {formError}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-medium text-[var(--admin-text)] hover:bg-[var(--admin-surface-alt)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--admin-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting && (
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                )}
                {editing ? 'Save Changes' : 'Create Service'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleting && (
        <ConfirmDialog
          title="Delete service?"
          message={`"${deleting.name}" will be permanently deleted if it has no appointment history. If it's been used before, it will be deactivated instead so past bookings stay intact.`}
          confirmLabel="Delete"
          danger
          isSubmitting={isDeleting}
          onConfirm={confirmDelete}
          onCancel={() => setDeleting(null)}
        />
      )}
    </div>
  )
}
