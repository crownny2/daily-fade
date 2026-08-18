import { NavLink } from 'react-router-dom'
import { LayoutDashboard, CalendarCheck2, CalendarClock, Bell, UserCog, LogOut, X } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/utils/cn'

const navItems = [
  { label: 'Dashboard', to: '/barber/dashboard', icon: LayoutDashboard },
  { label: 'My Appointments', to: '/barber/appointments', icon: CalendarCheck2 },
  { label: 'Schedule', to: '/barber/schedule', icon: CalendarClock },
  { label: 'Notifications', to: '/barber/notifications', icon: Bell },
  { label: 'Profile', to: '/barber/profile', icon: UserCog },
] as const

interface BarberSidebarProps {
  mobileOpen: boolean
  onCloseMobile: () => void
}

/**
 * Same visual system as AdminSidebar (same CSS vars, same structure) but a
 * separate component with its own two-item nav — kept independent so
 * nothing here can ever affect the Admin sidebar.
 */
export function BarberSidebar({ mobileOpen, onCloseMobile }: BarberSidebarProps) {
  const { user, logout } = useAuth()

  const handleLogout = async () => {
    await logout()
  }

  const content = (
    <div className="flex h-full flex-col bg-[var(--admin-sidebar-bg)]">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-[var(--admin-sidebar-border)] px-4">
        <span className="flex min-w-0 items-center gap-2.5">
          <img
            src="/assets/brand/daily-fade-logo.png"
            alt="Daily Fade Barbershop"
            className="h-9 w-9 shrink-0 object-contain"
          />
          <span className="truncate text-sm font-semibold tracking-wide text-white">
            Daily <span className="text-[var(--admin-accent)]">Fade</span>
          </span>
        </span>
        <button
          type="button"
          onClick={onCloseMobile}
          className="text-slate-400 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {navItems.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--admin-sidebar-active-bg)] text-[var(--admin-sidebar-text-active)]'
                  : 'text-[var(--admin-sidebar-text)] hover:bg-[var(--admin-sidebar-active-bg)]/60 hover:text-white'
              )
            }
          >
            <Icon className="h-[18px] w-[18px] shrink-0" />
            <span className="truncate">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="shrink-0 border-t border-[var(--admin-sidebar-border)] p-3">
        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--admin-accent)] text-xs font-semibold text-white">
            {(user?.name ?? 'B').charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{user?.name ?? 'Barber'}</p>
            <p className="truncate text-xs text-slate-500">{user?.email}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-red-500/10 hover:text-red-400"
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-[var(--admin-sidebar-border)] lg:block">
        {content}
      </aside>

      <div className={cn('fixed inset-0 z-40 lg:hidden', mobileOpen ? 'pointer-events-auto' : 'pointer-events-none')}>
        <div
          className={cn('absolute inset-0 bg-black/50 transition-opacity', mobileOpen ? 'opacity-100' : 'opacity-0')}
          onClick={onCloseMobile}
        />
        <aside
          className={cn(
            'absolute inset-y-0 left-0 w-72 max-w-[80vw] transition-transform duration-200',
            mobileOpen ? 'translate-x-0' : '-translate-x-full'
          )}
        >
          {content}
        </aside>
      </div>
    </>
  )
}
