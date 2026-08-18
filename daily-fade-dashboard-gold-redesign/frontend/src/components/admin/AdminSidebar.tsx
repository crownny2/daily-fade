import { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CalendarCheck2,
  Scissors,
  Users,
  CalendarClock,
  UserCircle2,
  CreditCard,
  BarChart3,
  Bell,
  Settings,
  LogOut,
  X,
  ArrowLeft,
  ChevronRight,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { fetchAdminNotifications } from '@/api/admin'
import { Logo } from '@/components/brand/Logo'
import { cn } from '@/utils/cn'

const UNREAD_POLL_INTERVAL_MS = 30_000

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

interface NavGroup {
  label: string
  items: NavItem[]
}

const navGroups: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', to: '/admin/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Operations',
    items: [
      { label: 'Appointments', to: '/admin/appointments', icon: CalendarCheck2 },
      { label: 'Barber Schedules', to: '/admin/barber-schedules', icon: CalendarClock },
      { label: 'Services', to: '/admin/services', icon: Scissors },
      { label: 'Barbers', to: '/admin/barbers', icon: Users },
    ],
  },
  {
    label: 'Accounts',
    items: [
      { label: 'Customers', to: '/admin/customers', icon: UserCircle2 },
      { label: 'Payments', to: '/admin/payments', icon: CreditCard },
    ],
  },
  {
    label: 'Insights',
    items: [
      { label: 'Reports', to: '/admin/reports', icon: BarChart3 },
      { label: 'Notifications', to: '/admin/notifications', icon: Bell },
    ],
  },
  {
    label: 'System',
    items: [{ label: 'Settings', to: '/admin/settings', icon: Settings }],
  },
]

interface AdminSidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onCloseMobile: () => void
}

export function AdminSidebar({ collapsed, mobileOpen, onCloseMobile }: AdminSidebarProps) {
  const { user, logout } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    const load = () => {
      fetchAdminNotifications({ per_page: 1 })
        .then((res) => setUnreadCount(res.meta?.unread_count ?? 0))
        .catch(() => {
          // Sidebar badge just won't update this cycle; non-critical.
        })
    }
    load()
    const interval = setInterval(load, UNREAD_POLL_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  const handleLogout = async () => {
    await logout()
  }

  const content = (
    <div className="flex h-full flex-col bg-[var(--admin-sidebar-bg)]">
      {/* Brand */}
      <div
        className={cn(
          'flex min-h-16 shrink-0 items-center border-b border-[var(--admin-sidebar-border)] px-4 py-3',
          collapsed ? 'justify-center' : 'justify-between'
        )}
      >
        {!collapsed && (
          <span className="flex min-w-0 items-center gap-2.5">
            <Logo size={30} />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate font-display text-base font-semibold tracking-wide text-white">
                DAILY <span className="text-[var(--admin-accent)]">FADE</span>
              </span>
              <span className="mt-0.5 whitespace-normal text-[9px] font-medium uppercase leading-[1.3] tracking-[0.12em] text-[var(--admin-sidebar-text)]">
                Precision · Style · Confidence
              </span>
            </span>
          </span>
        )}
        {collapsed && <Logo size={32} />}
        <button
          type="button"
          onClick={onCloseMobile}
          className="text-slate-400 hover:text-white lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-4 overflow-y-auto px-2 py-4">
        {navGroups.map((group) => (
          <div key={group.label}>
            {!collapsed && (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--admin-sidebar-text)]/50">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map(({ label, to, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onCloseMobile}
                  title={collapsed ? label : undefined}
                  className={({ isActive }) =>
                    cn(
                      'group relative flex items-center gap-3 rounded-lg py-2.5 pl-3 pr-2 text-sm font-medium transition-all duration-150',
                      collapsed && 'justify-center px-0',
                      isActive
                        ? 'bg-[var(--admin-sidebar-active-bg)] text-[var(--admin-sidebar-text-active)] shadow-sm'
                        : 'text-[var(--admin-sidebar-text)] hover:bg-white/5 hover:text-[var(--admin-sidebar-text-active)]'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <span className="absolute inset-y-1 left-0 w-[3px] rounded-full bg-[var(--admin-accent)]" />
                      )}
                      <Icon
                        className={cn(
                          'h-[18px] w-[18px] shrink-0 transition-colors',
                          isActive
                            ? 'text-[var(--admin-accent)]'
                            : 'text-[var(--admin-sidebar-text)] group-hover:text-[var(--admin-sidebar-text-active)]'
                        )}
                      />
                      {!collapsed && <span className="flex-1 truncate">{label}</span>}
                      {!collapsed && label === 'Notifications' && unreadCount > 0 && (
                        <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-[var(--admin-accent)] px-1.5 text-[11px] font-semibold leading-none text-white">
                          {unreadCount > 99 ? '99+' : unreadCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer: back to site, profile, logout */}
      <div className="shrink-0 border-t border-[var(--admin-sidebar-border)] p-3 pt-4">
        <a
          href="/"
          className={cn(
            'mb-3 flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium text-[var(--admin-text-subtle)] transition-colors hover:bg-white/5 hover:text-[var(--admin-sidebar-text-active)]',
            collapsed && 'justify-center px-0'
          )}
          title={collapsed ? 'Back to site' : undefined}
        >
          <ArrowLeft className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Back to site</span>}
        </a>

        <div className="relative">
          <button
            type="button"
            onClick={() => setProfileOpen((v) => !v)}
            className={cn(
              'flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-white/5',
              collapsed && 'justify-center px-0'
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--admin-accent)] text-xs font-semibold text-white">
              {(user?.name ?? 'A').charAt(0).toUpperCase()}
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-medium text-white">{user?.name ?? 'Admin'}</p>
                  <p className="truncate text-xs text-[var(--admin-text-subtle)]">{user?.email}</p>
                </span>
                <ChevronRight
                  className={cn(
                    'h-4 w-4 shrink-0 text-[var(--admin-text-subtle)] transition-transform',
                    profileOpen && 'rotate-90'
                  )}
                />
              </>
            )}
          </button>

          {!collapsed && profileOpen && (
            <div className="mt-1 overflow-hidden rounded-lg border border-[var(--admin-sidebar-border)] bg-black/20">
              <NavLink
                to="/admin/settings"
                onClick={() => {
                  setProfileOpen(false)
                  onCloseMobile()
                }}
                className="block px-3 py-2 text-sm text-[var(--admin-sidebar-text)] transition-colors hover:bg-white/5 hover:text-[var(--admin-sidebar-text-active)]"
              >
                Account settings
              </NavLink>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? 'Logout' : undefined}
          className={cn(
            'mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--admin-text-subtle)] transition-colors hover:bg-[var(--admin-danger-soft)] hover:text-[var(--admin-danger)]',
            collapsed && 'justify-center px-0'
          )}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop fixed sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 hidden border-r border-[var(--admin-sidebar-border)] transition-[width] duration-200 lg:block',
          collapsed ? 'w-[76px]' : 'w-64'
        )}
      >
        {content}
      </aside>

      {/* Mobile drawer */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden',
          mobileOpen ? 'pointer-events-auto' : 'pointer-events-none'
        )}
      >
        <div
          className={cn(
            'absolute inset-0 bg-black/50 transition-opacity',
            mobileOpen ? 'opacity-100' : 'opacity-0'
          )}
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
