import { useEffect, useState, type FormEvent } from 'react'
import {
  Store,
  Clock,
  CalendarCog,
  Wallet,
  UserCog,
  Palette,
  Save,
  Sun,
  Moon,
} from 'lucide-react'
import { fetchAdminSettings, updateAdminSettings, updateAdminProfile } from '@/api/admin'
import { extractErrorMessage } from '@/api/client'
import { useToast } from '@/hooks/useToast'
import { useAuth } from '@/hooks/useAuth'
import { useAdminTheme } from '@/hooks/useAdminTheme'
import { Avatar } from '@/components/admin/Avatar'
import { cn } from '@/utils/cn'
import type { AdminSettings, AdminSettingsPayload, BusinessHoursDay } from '@/types/admin'

function SectionCard({
  icon: Icon,
  title,
  description,
  children,
  extra,
}: {
  icon: typeof Store
  title: string
  description: string
  children: React.ReactNode
  extra?: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5"
      style={{ boxShadow: 'var(--admin-shadow)' }}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
            <Icon className="h-4.5 w-4.5" />
          </span>
          <div>
            <h3 className="text-sm font-semibold text-[var(--admin-text)]">{title}</h3>
            <p className="mt-0.5 text-xs text-[var(--admin-text-muted)]">{description}</p>
          </div>
        </div>
        {extra}
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
        className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none focus:border-[var(--admin-accent)]"
      />
    </label>
  )
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-6 w-11 shrink-0 rounded-full transition-colors',
        checked ? 'bg-[var(--admin-accent)]' : 'bg-[var(--admin-surface-alt)] border border-[var(--admin-border)]'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[22px]' : 'translate-x-0.5'
        )}
      />
    </button>
  )
}

function SaveBar({
  isSaving,
  isDirty,
  onSave,
  successMessage,
}: {
  isSaving: boolean
  isDirty: boolean
  onSave: () => void
  successMessage?: string | null
}) {
  return (
    <div className="flex items-center justify-end gap-3">
      {successMessage && <span className="text-xs font-medium text-[var(--admin-success)]">{successMessage}</span>}
      <button
        type="submit"
        onClick={onSave}
        disabled={!isDirty || isSaving}
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
  )
}

export function AdminSettingsPage() {
  const { showToast } = useToast()
  const { user, updateUser } = useAuth()
  const { theme, setTheme } = useAdminTheme()

  const [settings, setSettings] = useState<AdminSettings | null>(null)
  const [draft, setDraft] = useState<AdminSettingsPayload | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  // Admin profile draft (separate save flow from business settings)
  const [profileForm, setProfileForm] = useState({
    name: user?.name ?? '',
    email: user?.email ?? '',
    current_password: '',
    password: '',
    password_confirmation: '',
  })
  const [isProfileSaving, setIsProfileSaving] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)

  const load = () => {
    setIsLoading(true)
    setLoadError(null)
    fetchAdminSettings()
      .then((data) => {
        setSettings(data)
        const { updated_at, ...payload } = data
        void updated_at
        setDraft(payload)
        setIsDirty(false)
      })
      .catch((err) => setLoadError(extractErrorMessage(err, 'Could not load settings.')))
      .finally(() => setIsLoading(false))
  }

  useEffect(load, [])

  useEffect(() => {
    setProfileForm((f) => ({ ...f, name: user?.name ?? f.name, email: user?.email ?? f.email }))
  }, [user])

  const patchDraft = (patch: Partial<AdminSettingsPayload>) => {
    setDraft((current) => (current ? { ...current, ...patch } : current))
    setIsDirty(true)
    setSaveError(null)
  }

  const patchDay = (day: number, patch: Partial<BusinessHoursDay>) => {
    setDraft((current) => {
      if (!current) return current
      return {
        ...current,
        business_hours: current.business_hours.map((d) => (d.day_of_week === day ? { ...d, ...patch } : d)),
      }
    })
    setIsDirty(true)
    setSaveError(null)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!draft) return
    setSaveError(null)

    for (const day of draft.business_hours) {
      if (day.is_open && day.open_time >= day.close_time) {
        setSaveError(`${day.day_name}: closing time must be after opening time.`)
        return
      }
    }

    if (!draft.payment_cash_enabled && !draft.payment_gcash_enabled && !draft.payment_maya_enabled) {
      setSaveError('At least one payment method must be enabled.')
      return
    }

    setIsSaving(true)
    try {
      const updated = await updateAdminSettings(draft)
      setSettings(updated)
      const { updated_at, ...payload } = updated
      void updated_at
      setDraft(payload)
      setIsDirty(false)
      showToast('Settings saved.', 'success')
    } catch (err) {
      setSaveError(extractErrorMessage(err, 'Could not save settings.'))
    } finally {
      setIsSaving(false)
    }
  }

  const submitProfile = async (e: FormEvent) => {
    e.preventDefault()
    setProfileError(null)
    setProfileSuccess(null)

    if (profileForm.password && profileForm.password !== profileForm.password_confirmation) {
      setProfileError('New password and confirmation do not match.')
      return
    }
    if (profileForm.password && !profileForm.current_password) {
      setProfileError('Enter your current password to set a new one.')
      return
    }

    setIsProfileSaving(true)
    try {
      const payload = {
        name: profileForm.name,
        email: profileForm.email,
        ...(profileForm.password
          ? {
              current_password: profileForm.current_password,
              password: profileForm.password,
              password_confirmation: profileForm.password_confirmation,
            }
          : {}),
      }
      const updated = await updateAdminProfile(payload)
      updateUser({ name: updated.name, email: updated.email })
      setProfileForm((f) => ({ ...f, current_password: '', password: '', password_confirmation: '' }))
      setProfileSuccess('Profile updated.')
      showToast('Profile updated.', 'success')
    } catch (err) {
      setProfileError(extractErrorMessage(err, 'Could not update profile.'))
    } finally {
      setIsProfileSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-[var(--admin-surface-alt)]" />
        ))}
      </div>
    )
  }

  if (loadError || !draft || !settings) {
    return (
      <div className="flex items-center justify-between rounded-xl border border-[var(--admin-danger)]/30 bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]">
        <span>{loadError ?? 'Could not load settings.'}</span>
        <button type="button" onClick={load} className="font-medium underline underline-offset-2">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-[var(--admin-text)]">Settings</h2>
        <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
          Configure your shop's information, hours, and booking rules.
        </p>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* 1. Business Information */}
        <SectionCard icon={Store} title="Business Information" description="Shown to customers on the public site.">
          <div className="space-y-4">
            <TextField
              label="Barbershop Name"
              value={draft.business_name}
              onChange={(v) => patchDraft({ business_name: v })}
              placeholder="Crown's Barbershop"
            />
            <TextField
              label="Address"
              value={draft.address ?? ''}
              onChange={(v) => patchDraft({ address: v })}
              placeholder="Davao City, Philippines"
            />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <TextField label="Phone" value={draft.phone ?? ''} onChange={(v) => patchDraft({ phone: v })} placeholder="09XXXXXXXXX" />
              <TextField
                label="Email"
                type="email"
                value={draft.email ?? ''}
                onChange={(v) => patchDraft({ email: v })}
                placeholder="info@example.com"
              />
            </div>
            <TextField
              label="Website (optional)"
              value={draft.website ?? ''}
              onChange={(v) => patchDraft({ website: v })}
              placeholder="https://example.com"
            />
          </div>
        </SectionCard>

        {/* 2. Business Hours */}
        <SectionCard icon={Clock} title="Business Hours" description="Overall shop hours. Individual barber schedules are managed separately.">
          <div className="divide-y divide-[var(--admin-border)]">
            {draft.business_hours.map((day) => (
              <div key={day.day_of_week} className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-sm font-medium text-[var(--admin-text)]">{day.day_name}</span>
                  <label className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={day.is_open}
                      onChange={(e) => patchDay(day.day_of_week, { is_open: e.target.checked })}
                      className="h-4 w-4 rounded border-[var(--admin-border)]"
                    />
                    <span className={day.is_open ? 'text-[var(--admin-success)]' : 'text-[var(--admin-text-muted)]'}>
                      {day.is_open ? 'Open' : 'Closed'}
                    </span>
                  </label>
                </div>

                {day.is_open && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={day.open_time}
                      onChange={(e) => patchDay(day.day_of_week, { open_time: e.target.value })}
                      className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-2.5 py-1.5 text-sm text-[var(--admin-text)] outline-none"
                    />
                    <span className="text-[var(--admin-text-muted)]">to</span>
                    <input
                      type="time"
                      value={day.close_time}
                      onChange={(e) => patchDay(day.day_of_week, { close_time: e.target.value })}
                      className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-2.5 py-1.5 text-sm text-[var(--admin-text)] outline-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </SectionCard>

        {/* 3. Booking Settings */}
        <SectionCard icon={CalendarCog} title="Booking Settings" description="Rules applied when customers book online.">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-3">
              <div>
                <p className="text-sm font-medium text-[var(--admin-text)]">Online Booking</p>
                <p className="text-xs text-[var(--admin-text-muted)]">Allow customers to book appointments online.</p>
              </div>
              <ToggleSwitch checked={draft.online_booking_enabled} onChange={(v) => patchDraft({ online_booking_enabled: v })} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">Minimum booking notice (minutes)</span>
                <input
                  type="number"
                  min={0}
                  value={draft.min_booking_notice_minutes}
                  onChange={(e) => patchDraft({ min_booking_notice_minutes: Number(e.target.value) })}
                  className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
                />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">Maximum advance booking (days)</span>
                <input
                  type="number"
                  min={1}
                  value={draft.max_advance_booking_days}
                  onChange={(e) => patchDraft({ max_advance_booking_days: Number(e.target.value) })}
                  className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-[var(--admin-text-muted)]">Default appointment status</span>
              <select
                value={draft.default_appointment_status}
                onChange={(e) => patchDraft({ default_appointment_status: e.target.value as AdminSettingsPayload['default_appointment_status'] })}
                className="w-full rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2.5 text-sm text-[var(--admin-text)] outline-none"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
              </select>
            </label>
          </div>
        </SectionCard>

        {/* 4. Payment Settings */}
        <SectionCard icon={Wallet} title="Payment Settings" description="Payment methods available to customers.">
          <div className="space-y-3">
            {(
              [
                ['payment_cash_enabled', 'Cash'],
                ['payment_gcash_enabled', 'GCash'],
                ['payment_maya_enabled', 'Maya'],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="flex items-center justify-between rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-3">
                <p className="text-sm font-medium text-[var(--admin-text)]">{label}</p>
                <ToggleSwitch checked={draft[key]} onChange={(v) => patchDraft({ [key]: v } as Partial<AdminSettingsPayload>)} />
              </div>
            ))}
          </div>
        </SectionCard>

        {saveError && (
          <div className="rounded-lg bg-[var(--admin-danger-soft)] px-3 py-2.5 text-sm text-[var(--admin-danger)]">{saveError}</div>
        )}

        <SaveBar isSaving={isSaving} isDirty={isDirty} onSave={() => {}} />
      </form>

      {/* 5. Admin Profile */}
      <SectionCard
        icon={UserCog}
        title="Admin Profile"
        description="Update your own name, email, and password."
        extra={<Avatar name={profileForm.name || 'Admin'} size="lg" />}
      >
        <form onSubmit={submitProfile} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TextField label="Name" value={profileForm.name} onChange={(v) => setProfileForm((f) => ({ ...f, name: v }))} />
            <TextField
              label="Email"
              type="email"
              value={profileForm.email}
              onChange={(v) => setProfileForm((f) => ({ ...f, email: v }))}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <TextField
              label="Current Password"
              type="password"
              value={profileForm.current_password}
              onChange={(v) => setProfileForm((f) => ({ ...f, current_password: v }))}
              placeholder="Required to change password"
            />
            <TextField
              label="New Password"
              type="password"
              value={profileForm.password}
              onChange={(v) => setProfileForm((f) => ({ ...f, password: v }))}
              placeholder="Leave blank to keep current"
            />
            <TextField
              label="Confirm New Password"
              type="password"
              value={profileForm.password_confirmation}
              onChange={(v) => setProfileForm((f) => ({ ...f, password_confirmation: v }))}
            />
          </div>

          {profileError && (
            <div className="rounded-lg bg-[var(--admin-danger-soft)] px-3 py-2.5 text-sm text-[var(--admin-danger)]">{profileError}</div>
          )}

          <SaveBar isSaving={isProfileSaving} isDirty={true} onSave={() => {}} successMessage={profileSuccess} />
        </form>
      </SectionCard>

      {/* 6. Appearance */}
      <SectionCard icon={Palette} title="Appearance" description="Choose how the admin dashboard looks.">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
              theme === 'light'
                ? 'border-[var(--admin-accent)] bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]'
                : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-alt)]'
            )}
          >
            <Sun className="h-4 w-4" />
            Light
          </button>
          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
              theme === 'dark'
                ? 'border-[var(--admin-accent)] bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]'
                : 'border-[var(--admin-border)] text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-alt)]'
            )}
          >
            <Moon className="h-4 w-4" />
            Dark
          </button>
        </div>
      </SectionCard>
    </div>
  )
}
