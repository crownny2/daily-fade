import { Link } from 'react-router-dom'
import {
  CalendarCheck2,
  Clock,
  CheckCircle2,
  CheckCheck,
  Users,
  Scissors,
  Wallet,
  ListChecks,
  Calendar,
  ArrowRight,
  Bell,
  CalendarPlus,
  UserPlus,
  CreditCard,
} from 'lucide-react'
import { useFetch } from '@/hooks/useFetch'
import { useAuth } from '@/hooks/useAuth'
import { getDashboard } from '@/api/admin'
import { formatCurrency, formatDate, formatTime, timeAgo } from '@/utils/format'
import { StatCard } from '@/components/admin/StatCard'
import { AppointmentMiniList } from '@/components/admin/AppointmentMiniList'
import { QuickActions } from '@/components/admin/QuickActions'
import { TopList } from '@/components/admin/TopList'
import { TopBarbersList } from '@/components/admin/TopBarbersList'
import { RevenueAreaChart } from '@/components/admin/RevenueAreaChart'
import { StatusBadge } from '@/components/admin/StatusBadge'
import type { Appointment } from '@/types'

const activityIcon: Record<string, typeof CalendarPlus> = {
  appointment_new: CalendarPlus,
  appointment_confirmed: CheckCircle2,
  appointment_cancelled: Bell,
  appointment_completed: CheckCheck,
  appointment_no_show: Bell,
  payment_pending: CreditCard,
  payment_paid: Wallet,
  payment_failed: CreditCard,
  payment_refunded: CreditCard,
  customer_new: UserPlus,
  schedule_updated: Calendar,
}

function cardClass() {
  return 'rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5'
}

export function AdminDashboard() {
  const { user } = useAuth()
  const { data, isLoading, error, refetch } = useFetch(() => getDashboard())

  const statusBreakdown = [
    { label: 'Pending', value: data?.pending_appointments ?? 0, colorVar: '--admin-warning' },
    { label: 'Confirmed', value: data?.confirmed_appointments ?? 0, colorVar: '--admin-info' },
    { label: 'Completed', value: data?.completed_appointments ?? 0, colorVar: '--admin-success' },
    { label: 'Cancelled', value: data?.cancelled_appointments ?? 0, colorVar: '--admin-danger' },
  ]
  const statusTotal = statusBreakdown.reduce((sum, s) => sum + s.value, 0)

  const todayLabel = new Date().toLocaleDateString('en-PH', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  const upcomingGroups = groupByDate(data?.upcoming_appointments ?? [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <h2 className="text-lg font-semibold text-[var(--admin-text)]">
            Welcome back{user?.name ? `, ${user.name}` : ''} 👋
          </h2>
          <p className="mt-1 text-sm text-[var(--admin-text-muted)]">
            Here's what's happening at the shop today.
          </p>
        </div>
        <div className="flex items-center gap-2 self-start rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] px-3 py-2 text-xs font-medium text-[var(--admin-text-muted)] sm:self-auto">
          <Calendar className="h-4 w-4 text-[var(--admin-accent)]" />
          <span>{todayLabel}</span>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-xl border border-[var(--admin-danger)]/30 bg-[var(--admin-danger-soft)] px-4 py-3 text-sm text-[var(--admin-danger)]">
          <span>{error}</span>
          <button type="button" onClick={refetch} className="font-medium underline underline-offset-2">
            Retry
          </button>
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard
          label="Total Appointments"
          value={data?.total_appointments ?? 0}
          icon={CalendarCheck2}
          tone="accent"
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
          label="Today's Revenue"
          value={data ? formatCurrency(data.todays_revenue) : '—'}
          icon={Wallet}
          tone="success"
          isLoading={isLoading}
        />
        <StatCard
          label="Completed"
          value={data?.completed_appointments ?? 0}
          icon={CheckCheck}
          tone="success"
          isLoading={isLoading}
        />
        <StatCard
          label="Total Customers"
          value={data?.total_customers ?? 0}
          icon={Users}
          tone="accent"
          isLoading={isLoading}
        />
        <StatCard
          label="Total Barbers"
          value={data?.total_barbers ?? 0}
          icon={Scissors}
          tone="accent"
          isLoading={isLoading}
        />
        <StatCard
          label="Total Services"
          value={data?.total_services ?? 0}
          icon={ListChecks}
          tone="accent"
          isLoading={isLoading}
        />
      </div>

      {/* Revenue overview + appointment status + revenue summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={`${cardClass()} lg:col-span-1`}>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--admin-text)]">Revenue Overview</h3>
            <span className="rounded-md border border-[var(--admin-border)] px-2 py-1 text-[11px] text-[var(--admin-text-muted)]">
              This Week
            </span>
          </div>
          {isLoading ? (
            <div className="h-56 animate-pulse rounded-lg bg-[var(--admin-surface-alt)]" />
          ) : (
            <RevenueAreaChart
              points={(data?.revenue_trend ?? []).map((p) => ({ label: p.label, value: p.revenue }))}
              formatValue={(v) => formatCurrency(v)}
            />
          )}
        </div>

        <div className={cardClass()}>
          <h3 className="mb-4 text-sm font-semibold text-[var(--admin-text)]">Appointment Status</h3>
          <div className="flex items-center gap-5">
            <div
              className="relative flex h-28 w-28 shrink-0 items-center justify-center rounded-full"
              style={{
                background:
                  statusTotal === 0
                    ? 'var(--admin-surface-alt)'
                    : `conic-gradient(${buildConicStops(statusBreakdown, statusTotal)})`,
              }}
            >
              <div className="flex h-[72px] w-[72px] flex-col items-center justify-center rounded-full bg-[var(--admin-surface)]">
                <span className="text-lg font-semibold text-[var(--admin-text)]">{statusTotal}</span>
                <span className="text-[10px] text-[var(--admin-text-subtle)]">Total</span>
              </div>
            </div>
            <ul className="min-w-0 flex-1 space-y-2">
              {statusBreakdown.map((s) => (
                <li key={s.label} className="flex items-center justify-between gap-2 text-xs">
                  <span className="flex items-center gap-2 text-[var(--admin-text-muted)]">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: `var(${s.colorVar})` }}
                    />
                    {s.label}
                  </span>
                  <span className="font-medium text-[var(--admin-text)]">
                    {s.value} {statusTotal > 0 ? `(${Math.round((s.value / statusTotal) * 100)}%)` : ''}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className={cardClass()}>
          <h3 className="mb-4 text-sm font-semibold text-[var(--admin-text)]">Revenue Summary</h3>
          <ul className="space-y-3 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-[var(--admin-text-muted)]">Today</span>
              <span className="font-medium text-[var(--admin-text)]">
                {formatCurrency(data?.revenue_summary?.today ?? 0)}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-[var(--admin-text-muted)]">This Week</span>
              <span className="font-medium text-[var(--admin-text)]">
                {formatCurrency(data?.revenue_summary?.this_week ?? 0)}
              </span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-[var(--admin-text-muted)]">This Month</span>
              <span className="font-medium text-[var(--admin-text)]">
                {formatCurrency(data?.revenue_summary?.this_month ?? 0)}
              </span>
            </li>
            <li className="flex items-center justify-between border-t border-[var(--admin-border)] pt-3">
              <span className="text-[var(--admin-text-muted)]">Pending Payments</span>
              <span className="font-medium text-[var(--admin-warning)]">
                {formatCurrency(data?.revenue_summary?.pending_payments ?? 0)}
              </span>
            </li>
          </ul>
          <Link
            to="/admin/reports"
            className="mt-4 flex items-center gap-1 text-xs font-medium text-[var(--admin-accent)] hover:text-[var(--admin-accent-hover)]"
          >
            View full report <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Today's appointments / Upcoming / Quick actions */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={cardClass()}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--admin-text)]">Today's Appointments</h3>
            <Link to="/admin/appointments" className="text-xs font-medium text-[var(--admin-accent)] hover:text-[var(--admin-accent-hover)]">
              View all
            </Link>
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

        <div className={cardClass()}>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--admin-text)]">Upcoming Appointments</h3>
            <Link to="/admin/appointments" className="text-xs font-medium text-[var(--admin-accent)] hover:text-[var(--admin-accent-hover)]">
              View all
            </Link>
          </div>
          {isLoading ? (
            <SkeletonList />
          ) : upcomingGroups.length === 0 ? (
            <div className="flex h-32 items-center justify-center text-sm text-[var(--admin-text-muted)]">
              No upcoming appointments.
            </div>
          ) : (
            <div className="space-y-4">
              {upcomingGroups.map((group) => (
                <div key={group.dateKey}>
                  <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-[var(--admin-text-subtle)]">
                    {group.label}
                  </p>
                  <ul className="divide-y divide-[var(--admin-border)]">
                    {group.items.map((appt) => (
                      <li key={appt.id} className="flex items-center justify-between gap-3 py-2.5">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-[var(--admin-text)]">
                            {formatTime(appt.start_time)}
                            <span className="ml-2 font-normal text-[var(--admin-text-muted)]">
                              {appt.customer?.name ?? 'Customer'}
                            </span>
                          </p>
                          <p className="mt-0.5 truncate text-xs text-[var(--admin-text-muted)]">
                            {appt.service?.name ?? 'Service'}
                          </p>
                        </div>
                        <StatusBadge status={appt.status} />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={cardClass()}>
          <h3 className="mb-3 text-sm font-semibold text-[var(--admin-text)]">Quick Actions</h3>
          <QuickActions />
        </div>
      </div>

      {/* Top barbers / popular services / recent activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className={cardClass()}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--admin-text)]">Top Performing Barbers</h3>
            <Link to="/admin/barbers" className="text-xs font-medium text-[var(--admin-accent)] hover:text-[var(--admin-accent-hover)]">
              View all
            </Link>
          </div>
          <TopBarbersList barbers={data?.top_barbers ?? []} />
        </div>

        <div className={cardClass()}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--admin-text)]">Popular Services</h3>
            <Link to="/admin/services" className="text-xs font-medium text-[var(--admin-accent)] hover:text-[var(--admin-accent-hover)]">
              View all
            </Link>
          </div>
          <TopList
            items={(data?.popular_services ?? []).map((s) => ({ label: s.service ?? 'Unknown', value: s.bookings }))}
            emptyMessage="No bookings yet."
          />
        </div>

        <div className={cardClass()}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--admin-text)]">Recent Activities</h3>
            <Link to="/admin/notifications" className="text-xs font-medium text-[var(--admin-accent)] hover:text-[var(--admin-accent-hover)]">
              View all
            </Link>
          </div>
          {(data?.recent_activities ?? []).length === 0 ? (
            <p className="py-6 text-center text-sm text-[var(--admin-text-muted)]">No recent activity.</p>
          ) : (
            <ul className="space-y-4">
              {(data?.recent_activities ?? []).map((activity) => {
                const Icon = activityIcon[activity.type] ?? Bell
                return (
                  <li key={activity.id} className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
                      <Icon className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-[var(--admin-text)]">{activity.title}</p>
                      <p className="mt-0.5 truncate text-xs text-[var(--admin-text-muted)]">{activity.message}</p>
                      <p className="mt-0.5 text-[10px] text-[var(--admin-text-subtle)]">{timeAgo(activity.created_at)}</p>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function buildConicStops(segments: { value: number; colorVar: string }[], total: number): string {
  let acc = 0
  const stops: string[] = []
  for (const seg of segments) {
    if (seg.value === 0) continue
    const start = (acc / total) * 360
    acc += seg.value
    const end = (acc / total) * 360
    stops.push(`var(${seg.colorVar}) ${start}deg ${end}deg`)
  }
  return stops.join(', ')
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

/** Groups upcoming appointments by calendar date, labeling "Tomorrow" specially. */
function groupByDate(appointments: Appointment[]): { dateKey: string; label: string; items: Appointment[] }[] {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowKey = tomorrow.toISOString().slice(0, 10)

  const groups = new Map<string, Appointment[]>()
  for (const appt of appointments) {
    const key = appt.appointment_date
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(appt)
  }

  return Array.from(groups.entries()).map(([dateKey, items]) => ({
    dateKey,
    label: dateKey === tomorrowKey ? `Tomorrow • ${formatDate(dateKey).split(', ').slice(1).join(', ')}` : formatDate(dateKey),
    items,
  }))
}
