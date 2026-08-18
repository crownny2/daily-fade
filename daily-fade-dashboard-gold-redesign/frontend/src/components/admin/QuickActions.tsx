import { Link } from 'react-router-dom'
import { CalendarPlus, Scissors, Users, BarChart3, ChevronRight } from 'lucide-react'

const actions = [
  {
    label: 'New Appointment',
    description: 'Add a new appointment',
    to: '/admin/appointments',
    icon: CalendarPlus,
  },
  {
    label: 'Manage Services',
    description: 'Add, edit or remove services',
    to: '/admin/services',
    icon: Scissors,
  },
  {
    label: 'Manage Barbers',
    description: 'Add or manage barbers',
    to: '/admin/barbers',
    icon: Users,
  },
  {
    label: 'View Reports',
    description: 'Check analytics and reports',
    to: '/admin/reports',
    icon: BarChart3,
  },
] as const

export function QuickActions() {
  return (
    <div className="space-y-1">
      {actions.map(({ label, description, to, icon: Icon }) => (
        <Link
          key={to}
          to={to}
          className="group flex items-center gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-[var(--admin-surface-alt)]"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
            <Icon className="h-[18px] w-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-[var(--admin-text)]">{label}</p>
            <p className="truncate text-xs text-[var(--admin-text-muted)]">{description}</p>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[var(--admin-text-subtle)] transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}
    </div>
  )
}
