import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Save, UserCog } from 'lucide-react'
import { fetchBarberProfile, updateBarberProfile } from '@/api/barber'
import { extractErrorMessage } from '@/api/client'
import { useToast } from '@/hooks/useToast'
import type { BarberProfile as BarberProfileData } from '@/types/barber'

function SectionCard({ icon: Icon, title, description, children }: {
  icon: typeof UserCog
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <div
      className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5"
      style={{ boxShadow: 'var(--admin-shadow)' }}
    >
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
          <Icon className="h-4.5 w-4.5" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-[var(--admin-text)]">{title}</h3>
          <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
      />
    </label>
  )
}

function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={4}
        className="w-full resize-none rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
      />
    </label>
  )
}

/**
 * /barber/profile - view/update own profile.
 *
 * No "profile photo" field: there's no file-upload infrastructure
 * anywhere in this codebase yet (not even for admin's own barber
 * management screens), so building one from scratch here would be new,
 * unrelated infrastructure rather than reuse of something existing.
 */
export function BarberProfile() {
  const { showToast } = useToast()

  const [profile, setProfile] = useState<BarberProfileData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    specialty: '',
    bio: '',
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)

  const load = () => {
    setIsLoading(true)
    setLoadError(null)
    fetchBarberProfile()
      .then((data) => {
        setProfile(data)
        setForm((f) => ({
          ...f,
          name: data.name ?? '',
          email: data.email ?? '',
          phone: data.phone ?? '',
          specialty: data.specialty ?? '',
          bio: data.bio ?? '',
        }))
      })
      .catch((err) => setLoadError(extractErrorMessage(err, 'Could not load your profile.')))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaveError(null)
    setSaveSuccess(null)

    if (form.password && form.password !== form.password_confirmation) {
      setSaveError('New password and confirmation do not match.')
      return
    }
    if (form.password && !form.current_password) {
      setSaveError('Enter your current password to set a new one.')
      return
    }

    setIsSaving(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        phone: form.phone || null,
        specialty: form.specialty || null,
        bio: form.bio || null,
        ...(form.password
          ? {
              current_password: form.current_password,
              password: form.password,
              password_confirmation: form.password_confirmation,
            }
          : {}),
      }
      const updated = await updateBarberProfile(payload)
      setProfile(updated)
      setForm((f) => ({ ...f, current_password: '', password: '', password_confirmation: '' }))
      setSaveSuccess('Profile updated.')
      showToast('Profile updated.', 'success')
    } catch (err) {
      setSaveError(extractErrorMessage(err, 'Could not update profile.'))
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-6 w-40 animate-pulse rounded bg-[var(--admin-surface-alt)]" />
        <div className="h-64 animate-pulse rounded-xl bg-[var(--admin-surface-alt)]" />
      </div>
    )
  }

  if (loadError || !profile) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-[var(--admin-danger)]/30 bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]">
        <span>{loadError ?? 'Could not load your profile.'}</span>
        <button type="button" onClick={load} className="font-medium underline underline-offset-2">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-[var(--admin-text)]">My Profile</h2>
        <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
          Update your own contact details and password.
        </p>
      </div>

      <SectionCard icon={UserCog} title="Profile" description="This information is visible to the shop admin.">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Name" value={form.name} onChange={(v) => setForm((f) => ({ ...f, name: v }))} />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(v) => setForm((f) => ({ ...f, email: v }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField
              label="Phone"
              value={form.phone}
              onChange={(v) => setForm((f) => ({ ...f, phone: v }))}
              placeholder="e.g. 0917 123 4567"
            />
            <TextField
              label="Specialization"
              value={form.specialty}
              onChange={(v) => setForm((f) => ({ ...f, specialty: v }))}
              placeholder="e.g. Fades, Beard Grooming"
            />
          </div>

          <TextAreaField
            label="Bio"
            value={form.bio}
            onChange={(v) => setForm((f) => ({ ...f, bio: v }))}
            placeholder="A short introduction customers may see."
          />

          <div className="border-t border-[var(--admin-border)] pt-4">
            <p className="mb-3 text-xs font-medium text-[var(--admin-text-muted)]">Change password (optional)</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <TextField
                label="Current Password"
                type="password"
                value={form.current_password}
                onChange={(v) => setForm((f) => ({ ...f, current_password: v }))}
                placeholder="Required to change password"
              />
              <TextField
                label="New Password"
                type="password"
                value={form.password}
                onChange={(v) => setForm((f) => ({ ...f, password: v }))}
                placeholder="Leave blank to keep current"
              />
              <TextField
                label="Confirm New Password"
                type="password"
                value={form.password_confirmation}
                onChange={(v) => setForm((f) => ({ ...f, password_confirmation: v }))}
              />
            </div>
          </div>

          {saveError && (
            <div className="rounded-lg bg-[var(--admin-danger-soft)] px-3 py-2.5 text-sm text-[var(--admin-danger)]">
              {saveError}
            </div>
          )}

          <div className="flex items-center justify-end gap-3">
            {saveSuccess && <span className="text-xs font-medium text-[var(--admin-success)]">{saveSuccess}</span>}
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 rounded-lg bg-[var(--admin-accent)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--admin-accent-hover)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </button>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}
