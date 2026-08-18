import { useEffect, useState, type FormEvent } from 'react'
import {
  Wallet,
  CalendarCheck2,
  CheckCheck,
  CheckCircle2,
  Clock,
  XCircle,
  Banknote,
  Smartphone,
  CreditCard,
  Scissors,
  Users,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { fetchAdminReports } from '@/api/admin'
import { extractErrorMessage } from '@/api/client'
import { TrendChart } from '@/components/admin/TrendChart'
import { TopList } from '@/components/admin/TopList'
import { formatCurrency, formatDate } from '@/utils/format'
import { cn } from '@/utils/cn'
import type { AdminReportsData, ReportRange } from '@/types/admin'

const RANGE_OPTIONS: { value: ReportRange; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'custom', label: 'Custom Range' },
]

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function AdminReports() {
  const [range, setRange] = useState<ReportRange>('today')
  const [startDate, setStartDate] = useState(todayStr())
  const [endDate, setEndDate] = useState(todayStr())
  const [appliedCustom, setAppliedCustom] = useState<{ start: string; end: string } | null>(null)

  const [data, setData] = useState<AdminReportsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = () => {
    if (range === 'custom' && !appliedCustom) return

    setIsLoading(true)
    setError(null)
    fetchAdminReports({
      range,
      start_date: range === 'custom' ? appliedCustom?.start : undefined,
      end_date: range === 'custom' ? appliedCustom?.end : undefined,
    })
      .then((res) => setData(res))
      .catch((err) => setError(extractErrorMessage(err, 'Could not load reports.')))
      .finally(() => setIsLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, appliedCustom])

  const selectRange = (value: ReportRange) => {
    setRange(value)
    if (value !== 'custom') {
      setAppliedCustom(null)
    }
  }

  const applyCustomRange = (e: FormEvent) => {
    e.preventDefault()
    if (!startDate || !endDate || startDate > endDate) return
    setAppliedCustom({ start: startDate, end: endDate })
  }


  return (
    <div className="space-y-6">
      <style>{`
        @keyframes reportFadeUp {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .report-fade-up {
          animation: reportFadeUp 0.35s ease-out both;
        }
        @media (prefers-reduced-motion: reduce) {
          .report-fade-up { animation: none; }
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col gap-1">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--admin-accent)]">
          Analytics
        </span>
        <h2 className="text-xl font-semibold text-[var(--admin-text)]">Reports</h2>
        <p className="text-sm text-[var(--admin-text-muted)]">
          {data
            ? `Showing ${data.range.label} · ${formatDate(data.range.start_date)} – ${formatDate(data.range.end_date)}`
            : 'Revenue and appointment analytics.'}
        </p>
      </div>

      {/* Range selector — segmented control */}
      <div
        className="flex flex-col gap-3 rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 sm:flex-row sm:flex-wrap sm:items-center"
        style={{ boxShadow: 'var(--admin-shadow)' }}
      >
        <div className="relative flex flex-wrap gap-1 rounded-lg bg-[var(--admin-surface-alt)] p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => selectRange(opt.value)}
              className={cn(
                'relative z-10 rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-200',
                range === opt.value
                  ? 'bg-[var(--admin-accent)] text-white shadow-sm'
                  : 'text-[var(--admin-text-muted)] hover:text-[var(--admin-text)]'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {range === 'custom' && (
          <form onSubmit={applyCustomRange} className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={startDate}
              max={endDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none transition-colors focus:border-[var(--admin-accent)]"
            />
            <span className="text-sm text-[var(--admin-text-muted)]">to</span>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] px-3 py-2 text-sm text-[var(--admin-text)] outline-none transition-colors focus:border-[var(--admin-accent)]"
            />
            <button
              type="submit"
              className="rounded-lg bg-[var(--admin-accent)] px-3 py-2 text-sm font-semibold text-white transition-transform hover:bg-[var(--admin-accent-hover)] active:scale-95"
            >
              Apply
            </button>
          </form>
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

      {!error && range === 'custom' && !appliedCustom && (
        <div className="rounded-xl border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface)] px-4 py-3 text-sm text-[var(--admin-text-muted)]">
          Pick a start and end date, then click Apply.
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <EnhancedStatCard
          label="Total Revenue"
          value={data ? formatCurrency(data.total_revenue) : '—'}
          icon={Wallet}
          tone="success"
          isLoading={isLoading}
          delay={0}
        />
        <EnhancedStatCard
          label="Appointments"
          value={data?.total_appointments ?? 0}
          icon={CalendarCheck2}
          tone="accent"
          isLoading={isLoading}
          delay={40}
        />
        <EnhancedStatCard
          label="Completed"
          value={data?.completed_appointments ?? 0}
          icon={CheckCheck}
          tone="success"
          isLoading={isLoading}
          delay={80}
        />
        <EnhancedStatCard
          label="Confirmed"
          value={data?.confirmed_appointments ?? 0}
          icon={CheckCircle2}
          tone="info"
          isLoading={isLoading}
          delay={120}
        />
        <EnhancedStatCard
          label="Pending"
          value={data?.pending_appointments ?? 0}
          icon={Clock}
          tone="warning"
          isLoading={isLoading}
          delay={160}
        />
        <EnhancedStatCard
          label="Cancelled"
          value={data?.cancelled_appointments ?? 0}
          icon={XCircle}
          tone="danger"
          isLoading={isLoading}
          delay={200}
        />
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Revenue Trend" icon={TrendingUp}>
          {isLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-[var(--admin-surface-alt)]" />
          ) : (
            <TrendChart
              points={(data?.revenue_trend ?? []).map((p) => ({ date: p.date, value: p.revenue ?? 0 }))}
              formatValue={(v) => formatCurrency(v)}
              emptyMessage="No revenue recorded for this range."
            />
          )}
        </SectionCard>

        <SectionCard title="Appointment Trend" icon={CalendarCheck2}>
          {isLoading ? (
            <div className="h-40 animate-pulse rounded-lg bg-[var(--admin-surface-alt)]" />
          ) : (
            <TrendChart
              points={(data?.appointment_trend ?? []).map((p) => ({ date: p.date, value: p.total ?? 0 }))}
              barColorVar="--admin-info"
              emptyMessage="No appointments in this range."
            />
          )}
        </SectionCard>
      </div>

      {/* Top services / barbers */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Top Services" icon={Scissors}>
          {isLoading ? (
            <div className="h-32 animate-pulse rounded-lg bg-[var(--admin-surface-alt)]" />
          ) : (
            <TopList
              items={(data?.top_services ?? []).map((s) => ({ label: s.service ?? 'Unknown', value: s.bookings }))}
              emptyMessage="No bookings in this range."
            />
          )}
        </SectionCard>

        <SectionCard title="Top Barbers" icon={Users}>
          {isLoading ? (
            <div className="h-32 animate-pulse rounded-lg bg-[var(--admin-surface-alt)]" />
          ) : (
            <TopList
              items={(data?.top_barbers ?? []).map((b) => ({ label: b.barber ?? 'Unknown', value: b.bookings }))}
              emptyMessage="No bookings in this range."
            />
          )}
        </SectionCard>
      </div>

      {/* Payment breakdown */}
      <SectionCard title="Payment Breakdown">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PaymentBreakdownCard
            label="Cash"
            icon={Banknote}
            count={data?.payment_breakdown.cash.count ?? 0}
            total={data?.payment_breakdown.cash.total ?? 0}
            grandTotal={data?.total_revenue ?? 0}
            isLoading={isLoading}
          />
          <PaymentBreakdownCard
            label="GCash"
            icon={Smartphone}
            count={data?.payment_breakdown.gcash.count ?? 0}
            total={data?.payment_breakdown.gcash.total ?? 0}
            grandTotal={data?.total_revenue ?? 0}
            isLoading={isLoading}
          />
          <PaymentBreakdownCard
            label="Maya"
            icon={CreditCard}
            count={data?.payment_breakdown.maya.count ?? 0}
            total={data?.payment_breakdown.maya.total ?? 0}
            grandTotal={data?.total_revenue ?? 0}
            isLoading={isLoading}
          />
        </div>
      </SectionCard>

      {/* Recent transactions */}
      <div
        className="overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)]"
        style={{ boxShadow: 'var(--admin-shadow)' }}
      >
        <div className="flex items-center justify-between border-b border-[var(--admin-border)] px-5 py-3">
          <h3 className="text-sm font-semibold text-[var(--admin-text)]">Recent Transactions</h3>
          {!isLoading && (
            <span className="text-xs text-[var(--admin-text-muted)]">
              {(data?.recent_transactions ?? []).length} shown
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-[var(--admin-border)] bg-[var(--admin-surface-alt)] text-xs uppercase tracking-wide text-[var(--admin-text-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">Booking Ref</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Method</th>
                <th className="px-4 py-3 font-medium">Paid At</th>
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

              {!isLoading && (data?.recent_transactions ?? []).length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center">
                    <p className="text-sm font-medium text-[var(--admin-text)]">No transactions yet</p>
                    <p className="mt-1 text-xs text-[var(--admin-text-muted)]">
                      Paid bookings for this range will show up here.
                    </p>
                  </td>
                </tr>
              )}

              {!isLoading &&
                (data?.recent_transactions ?? []).map((tx) => (
                  <tr key={tx.id} className="transition-colors hover:bg-[var(--admin-surface-alt)]/60">
                    <td className="px-4 py-3 font-mono text-xs text-[var(--admin-text)]">{tx.booking_reference ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--admin-text)]">{tx.customer ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--admin-text)]">{tx.service ?? '—'}</td>
                    <td className="px-4 py-3 font-medium text-[var(--admin-text)]">{formatCurrency(tx.amount)}</td>
                    <td className="px-4 py-3">
                      <MethodBadge method={tx.method} />
                    </td>
                    <td className="px-4 py-3 text-[var(--admin-text-muted)]">
                      {tx.paid_at ? new Date(tx.paid_at).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

const TONE_STYLES: Record<string, { bg: string; text: string; bar: string }> = {
  success: { bg: 'bg-[var(--admin-success-soft)]', text: 'text-[var(--admin-success)]', bar: 'bg-[var(--admin-success)]' },
  accent: { bg: 'bg-[var(--admin-accent-soft)]', text: 'text-[var(--admin-accent)]', bar: 'bg-[var(--admin-accent)]' },
  info: { bg: 'bg-[var(--admin-info-soft)]', text: 'text-[var(--admin-info)]', bar: 'bg-[var(--admin-info)]' },
  warning: { bg: 'bg-[var(--admin-warning-soft)]', text: 'text-[var(--admin-warning)]', bar: 'bg-[var(--admin-warning)]' },
  danger: { bg: 'bg-[var(--admin-danger-soft)]', text: 'text-[var(--admin-danger)]', bar: 'bg-[var(--admin-danger)]' },
}

function EnhancedStatCard({
  label,
  value,
  icon: Icon,
  tone,
  isLoading,
  delay = 0,
}: {
  label: string
  value: string | number
  icon: LucideIcon
  tone: keyof typeof TONE_STYLES
  isLoading: boolean
  delay?: number
}) {
  const styles = TONE_STYLES[tone]
  return (
    <div
      className="report-fade-up group relative overflow-hidden rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-4 transition-transform duration-200 hover:-translate-y-0.5"
      style={{ boxShadow: 'var(--admin-shadow)', animationDelay: `${delay}ms` }}
    >
      <span className={cn('absolute inset-y-0 left-0 w-1', styles.bar)} />
      <div className="flex items-start justify-between gap-2 pl-2">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-[var(--admin-text-muted)]">
            {label}
          </p>
          {isLoading ? (
            <div className="mt-2 h-6 w-16 animate-pulse rounded bg-[var(--admin-surface-alt)]" />
          ) : (
            <p className="mt-1 text-xl font-semibold text-[var(--admin-text)]">{value}</p>
          )}
        </div>
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', styles.bg, styles.text)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon?: LucideIcon
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-5"
      style={{ boxShadow: 'var(--admin-shadow)' }}
    >
      <div className="mb-3 flex items-center gap-2">
        {Icon && <Icon className="h-4 w-4 text-[var(--admin-accent)]" />}
        <h3 className="text-sm font-semibold text-[var(--admin-text)]">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function PaymentBreakdownCard({
  label,
  icon: Icon,
  count,
  total,
  grandTotal,
  isLoading,
}: {
  label: string
  icon: LucideIcon
  count: number
  total: number
  grandTotal: number
  isLoading: boolean
}) {
  const pct = grandTotal > 0 ? Math.round((total / grandTotal) * 100) : 0

  return (
    <div className="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-alt)] p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--admin-text-muted)]">{label}</p>
          {isLoading ? (
            <div className="mt-1 h-5 w-20 animate-pulse rounded bg-[var(--admin-surface)]" />
          ) : (
            <>
              <p className="text-base font-semibold text-[var(--admin-text)]">{formatCurrency(total)}</p>
              <p className="text-xs text-[var(--admin-text-muted)]">
                {count} transaction{count === 1 ? '' : 's'}
              </p>
            </>
          )}
        </div>
      </div>
      {!isLoading && (
        <div className="mt-3">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--admin-surface)]">
            <div
              className="h-full rounded-full bg-[var(--admin-accent)] transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1 text-right text-[11px] text-[var(--admin-text-muted)]">{pct}% of total</p>
        </div>
      )}
    </div>
  )
}

const METHOD_STYLES: Record<string, string> = {
  cash: 'bg-[var(--admin-success-soft)] text-[var(--admin-success)]',
  gcash: 'bg-[var(--admin-info-soft)] text-[var(--admin-info)]',
  maya: 'bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]',
}

function MethodBadge({ method }: { method?: string | null }) {
  if (!method) return <span className="text-[var(--admin-text-muted)]">—</span>
  const style = METHOD_STYLES[method.toLowerCase()] ?? 'bg-[var(--admin-surface-alt)] text-[var(--admin-text-muted)]'
  return (
    <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium capitalize', style)}>
      {method}
    </span>
  )
}
