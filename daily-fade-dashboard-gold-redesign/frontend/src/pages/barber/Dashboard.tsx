import { CalendarCheck2, Clock, CheckCircle2, CheckCheck, CalendarClock } from 'lucide-react'
import { useFetch } from '@/hooks/useFetch'
import { useAuth } from '@/hooks/useAuth'
import { getBarberDashboard } from '@/api/barber'
import { StatCard } from '@/components/admin/StatCard'
import { AppointmentMiniList } from '@/components/admin/AppointmentMiniList'

export function BarberDashboard() {
  const { user } = useAuth()
  const { data, isLoading, error, refetch } = useFetch(() => getBarberDashboard())

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[var(--admin-text)]">
          Welcome back{user?.name ? `, ${user.name}` : ''} 👋
        </h2>
        <p className="mt-1 text-sm text-[var(--admin-text-muted)]">Here's what's on your books.</p>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-[var(--admin-danger)]/30 bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]">
          <span>{error}</span>
          <button type="button" onClick={refetch} className="font-medium underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard
          label="Today"
          value={data?.today_appointments_count ?? 0}
          icon={CalendarCheck2}
          tone="accent"
          isLoading={isLoading}
        />
        <StatCard
          label="Upcoming"
          value={data?.upcoming_appointments_count ?? 0}
          icon={CalendarClock}
          isLoading={isLoading}
        />
        <StatCard
          label="Pending"
          value={data?.pending_appointments ?? 0}
          icon={Clock}
          tone="warning"
          isLoading={isLoading}
        />
        <StatCard
          label="Confirmed"
          value={data?.confirmed_appointments ?? 0}
          icon={CheckCircle2}
          tone="info"
          isLoading={isLoading}
        />
        <StatCard
          label="Completed"
          value={data?.completed_appointments ?? 0}
          icon={CheckCheck}
          tone="success"
          isLoading={isLoading}
        />
      </div>

      {/* Appointment panels */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div
          className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5"
          style={{ boxShadow: 'var(--admin-shadow)' }}
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--admin-text)]">Today's Appointments</h3>
            <span className="text-xs text-[var(--admin-text-muted)]">
              {data?.today_appointments_count ?? 0} total
            </span>
          </div>
          {isLoading ? (
            <SkeletonList />
          ) : (
            <AppointmentMiniList
              appointments={data?.todays_appointments ?? []}
              emptyMessage="No appointments scheduled for today."
            />
          )}
        </div>

        <div
          className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5"
          style={{ boxShadow: 'var(--admin-shadow)' }}
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--admin-text)]">Upcoming Appointments</h3>
          </div>
          {isLoading ? (
            <SkeletonList />
          ) : (
            <AppointmentMiniList
              appointments={data?.upcoming_appointments ?? []}
              emptyMessage="Nothing else on the books yet."
              showDate
            />
          )}
        </div>
      </div>
    </div>
  )
}

function SkeletonList() {
  return (
    <div className="space-y-3 py-1">
      {[0, 1, 2].map((i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-[var(--admin-surface-alt)]" />
      ))}
    </div>
  )
}
