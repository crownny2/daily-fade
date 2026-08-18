import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { AdminThemeProvider } from '@/context/AdminThemeContext'
import { useAdminTheme } from '@/hooks/useAdminTheme'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { cn } from '@/utils/cn'

const PAGE_TITLES: Record<string, string> = {
  '/admin/dashboard': 'Dashboard',
  '/admin/appointments': 'Appointments',
  '/admin/services': 'Services',
  '/admin/barbers': 'Barbers',
  '/admin/barber-schedules': 'Barber Schedules',
  '/admin/customers': 'Customers',
  '/admin/payments': 'Payments',
  '/admin/reports': 'Reports',
  '/admin/notifications': 'Notifications',
  '/admin/settings': 'Settings',
}

function AdminShell() {
  const { theme } = useAdminTheme()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  const title = PAGE_TITLES[location.pathname] ?? 'Admin'

  return (
    <div
      data-theme={theme}
      className="admin-shell min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]"
    >
      <AdminSidebar collapsed={collapsed} mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className={cn('transition-[padding] duration-200', collapsed ? 'lg:pl-[76px]' : 'lg:pl-64')}>
        <AdminHeader
          title={title}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          onOpenMobileSidebar={() => setMobileOpen(true)}
        />
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export function AdminLayout() {
  return (
    <AdminThemeProvider>
      <AdminShell />
    </AdminThemeProvider>
  )
}
