import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Search, Pencil, Power, Users, Eye, CalendarClock, Mail, Phone } from 'lucide-react'
import {
  createBarber,
  fetchAdminBarbers,
  toggleBarberStatus,
  updateBarber,
} from '@/api/admin'
import { extractErrorMessage } from '@/api/client'
import { useToast } from '@/hooks/useToast'
import { Modal } from '@/components/admin/Modal'
import { ConfirmDialog } from '@/components/admin/ConfirmDialog'
import { Avatar } from '@/components/admin/Avatar'
import { DotBadge } from '@/components/admin/DotBadge'
import { cn } from '@/utils/cn'
import type { AdminBarber, BarberPayload } from '@/types/admin'

const emptyForm: BarberPayload = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  specialty: '',
  is_active: true,
}

const statusFilters = [
  { label: 'All', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
] as const

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[0-9+\-\s()]{7,20}$/

export function AdminBarbers() {
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [barbers, setBarbers] = useState<AdminBarber[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<'' | 'active' | 'inactive'>('')

  const [editing, setEditing] = useState<AdminBarber | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<BarberPayload>(emptyForm)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [viewing, setViewing] = useState<AdminBarber | null>(null)

  const [toggling, setToggling] = useState<AdminBarber | null>(null)
  const [isToggling, setIsToggling] = useState(false)

  const load = () => {
    setIsLoading(true)
    setError(null)
    fetchAdminBarbers()
      .then(setBarbers)
      .catch((err) => setError(extractErrorMessage(err, 'Could not load barbers.')))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  const filtered = barbers.filter((b) => {
    const matchesStatus = status === '' || b.status === status
    if (!matchesStatus) return false

    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      (b.name ?? '').toLowerCase().includes(q) ||
      (b.specialty ?? '').toLowerCase().includes(q) ||
      (b.email ?? '').toLowerCase().includes(q)
    )
  })

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm)
    setFormError(null)
    setShowForm(true)
  }

  const openEdit = (barber: AdminBarber) => {
    setEditing(barber)
    setForm({
      first_name: barber.first_name,
      last_name: barber.last_name,
      email: barber.email ?? '',
      phone: barber.phone ?? '',
      specialty: barber.specialty ?? '',
      is_active: barber.is_active,
    })
    setFormError(null)
    setShowForm(true)
  }

  const submitForm = async (e: FormEvent) => {
    e.preventDefault()
    setFormError(null)

    if (!form.first_name.trim() || !form.last_name.trim()) {
      setFormError('First and last name are required.')
      return
    }
    if (!EMAIL_RE.test(form.email.trim())) {
      setFormError('Please enter a valid email address.')
      return
    }
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) {
      setFormError('Please enter a valid phone number.')
      return
    }
    if (!form.specialty.trim()) {
      setFormError('Specialty is required.')
      return
    }

    setIsSubmitting(true)
    try {
      if (editing) {
        const updated = await updateBarber(editing.id, form)
        setBarbers((current) => current.map((b) => (b.id === updated.id ? updated : b)))
        showToast('Barber updated.', 'success')
      } else {
        const created = await createBarber(form)
        setBarbers((current) => [...current, created])
        showToast('Barber created.', 'success')
      }
      setShowForm(false)
    } catch (err) {
      setFormError(extractErrorMessage(err, 'Could not save this barber.'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const confirmToggle = async () => {
    if (!toggling) return
    setIsToggling(true)
    try {
      const updated = await toggleBarberStatus(toggling.id)
      setBarbers((current) => current.map((b) => (b.id === updated.id ? updated : b)))
      showToast(updated.is_active ? 'Barber activated.' : 'Barber deactivated.', 'success')
      setToggling(null)
    } catch (err) {
      showToast(extractErrorMessage(err, 'Could not update barber status.'), 'error')
    } finally {
      setIsToggling(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">Barbers</h2>
          <p className="mt-1 text-sm text-[var(--admin-text-muted)]">Manage the barbers available for booking.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center justify-center gap-2 rounded-lg bg-[var(--admin-accent)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--admin-accent-hover)]"
        >
          <Plus className="h-4 w-4" />
          Add Barber
        </button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2 sm:max-w-xs">
          <Search className="h-4 w-4 shrink-0 text-[var(--admin-text-subtle)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search barbers..."
            className="w-full bg-transparent text-sm text-[var(--admin-text)] outline-none placeholder:text-[var(--admin-text-subtle)]"
          />
        </div>

        <div className="flex items-center gap-1.5 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-1">
          {statusFilters.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setStatus(f.value)}
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                status === f.value
                  ? 'bg-[var(--admin-accent)] text-white'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
              )}
            >
              {f.label}
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
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-alt)] text-xs uppercase tracking-wide text-[var(--admin-text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Specialty</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Phone</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--admin-border)]">
              {isLoading &&
                [0, 1, 2].map((i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-5 animate-pulse rounded bg-[var(--admin-surface-alt)]" />
                    </td>
                  </tr>
                ))}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <Users className="h-8 w-8 text-[var(--admin-text-subtle)]" />
                      <p className="text-sm text-[var(--admin-text-muted)]">
                        {search || status
                          ? 'No barbers match your search or filter.'
                          : 'No barbers yet. Add your first one.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!isLoading &&
                filtered.map((barber) => (
                  <tr key={barber.id} className="hover:bg-[var(--admin-surface-alt)]/60">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={barber.name} />
                        <span className="font-medium text-[var(--admin-text)]">{barber.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-[var(--admin-text-muted)]">{barber.specialty || '—'}</td>
                    <td className="px-4 py-4 text-[var(--admin-text-muted)]">{barber.email || '—'}</td>
                    <td className="px-4 py-4 text-[var(--admin-text-muted)]">{barber.phone || '—'}</td>
                    <td className="px-4 py-4">
                      <DotBadge label={barber.is_active ? 'Active' : 'Inactive'} tone={barber.is_active ? 'success' : 'muted'} />
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="View"
                          onClick={() => setViewing(barber)}
                          className="rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-alt)] hover:text-[var(--admin-text)]"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => openEdit(barber)}
                          className="rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-alt)] hover:text-[var(--admin-text)]"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Manage Schedule"
                          onClick={() => navigate(`/admin/barber-schedules?barber=${barber.id}`)}
                          className="rounded-lg p-1.5 text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-alt)] hover:text-[var(--admin-text)]"
                        >
                          <CalendarClock className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title={barber.is_active ? 'Deactivate' : 'Activate'}
                          onClick={() => setToggling(barber)}
                          className="rounded-lg p-1.5 text-[var(--admin-info)] hover:bg-[var(--admin-info-soft)]"
                        >
                          <Power className="h-4 w-4" />
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
        <Modal title={editing ? 'Edit Barber' : 'Add Barber'} onClose={() => setShowForm(false)}>
          <form onSubmit={submitForm} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">First Name</span>
                <input
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
                  placeholder="Jayson"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">Last Name</span>
                <input
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                  className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
                  placeholder="Cruz"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">Email</span>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
                placeholder="jayson@email.com"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">Phone</span>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
                placeholder="0917 000 0000"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">Specialty</span>
              <input
                value={form.specialty}
                onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
                className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
                placeholder="e.g. Fades & Tapers"
              />
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.is_active}
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
                {editing ? 'Save Changes' : 'Create Barber'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* View details */}
      {viewing && (
        <Modal title="Barber Details" onClose={() => setViewing(null)}>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Avatar name={viewing.name} size="lg" />
              <div>
                <p className="text-base font-semibold text-[var(--admin-text)]">{viewing.name}</p>
                <p className="text-sm text-[var(--admin-text-muted)]">{viewing.specialty || 'No specialty set'}</p>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-[var(--admin-text)]">
                <Mail className="h-4 w-4 text-[var(--admin-text-subtle)]" />
                {viewing.email || '—'}
              </div>
              <div className="flex items-center gap-2 text-[var(--admin-text)]">
                <Phone className="h-4 w-4 text-[var(--admin-text-subtle)]" />
                {viewing.phone || '—'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-3 text-sm">
              <div>
                <p className="text-xs text-[var(--admin-text-muted)]">Status</p>
                <p className="mt-0.5 font-medium text-[var(--admin-text)]">{viewing.is_active ? 'Active' : 'Inactive'}</p>
              </div>
              <div>
                <p className="text-xs text-[var(--admin-text-muted)]">Created</p>
                <p className="mt-0.5 font-medium text-[var(--admin-text)]">{viewing.created_at ?? '—'}</p>
              </div>
              {typeof viewing.appointments_count === 'number' && (
                <div className="col-span-2">
                  <p className="text-xs text-[var(--admin-text-muted)]">Appointments</p>
                  <p className="mt-0.5 font-medium text-[var(--admin-text)]">{viewing.appointments_count}</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button
                type="button"
                onClick={() => {
                  navigate(`/admin/barber-schedules?barber=${viewing.id}`)
                  setViewing(null)
                }}
                className="flex items-center gap-2 rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-medium text-[var(--admin-text)] hover:bg-[var(--admin-surface-alt)]"
              >
                <CalendarClock className="h-4 w-4" />
                Manage Schedule
              </button>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--admin-accent-hover)]"
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {toggling && (
        <ConfirmDialog
          title={toggling.is_active ? `Deactivate ${toggling.name}?` : `Activate ${toggling.name}?`}
          message={
            toggling.is_active
              ? 'Inactive barbers cannot receive new appointments. Existing appointments are not affected.'
              : 'This barber will become bookable by customers again.'
          }
          confirmLabel={toggling.is_active ? 'Deactivate' : 'Activate'}
          danger={toggling.is_active}
          isSubmitting={isToggling}
          onConfirm={confirmToggle}
          onCancel={() => setToggling(null)}
        />
      )}
    </div>
  )
}
