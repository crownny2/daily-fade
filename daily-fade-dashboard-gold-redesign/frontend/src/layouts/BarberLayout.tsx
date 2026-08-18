import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { BarberSidebar } from '@/components/barber/BarberSidebar'
import { BarberHeader } from '@/components/barber/BarberHeader'

const PAGE_TITLES: Record<string, string> = {
  '/barber/dashboard': 'Dashboard',
  '/barber/appointments': 'My Appointments',
  '/barber/schedule': 'My Schedule',
  '/barber/notifications': 'Notifications',
  '/barber/profile': 'My Profile',
}

/**
 * Mirrors AdminLayout's shell (same .admin-shell CSS var system, same
 * sticky header + fixed sidebar structure) but fixed to dark theme — the
 * barber portal doesn't need its own light/dark toggle for this phase, so
 * it doesn't pull in AdminThemeContext (that context is Admin-specific).
 */
export function BarberLayout() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)

  const title = PAGE_TITLES[location.pathname] ?? 'Barber Portal'

  return (
    <div data-theme="dark" className="admin-shell min-h-screen bg-[var(--admin-bg)] text-[var(--admin-text)]">
      <BarberSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />

      <div className="lg:pl-64">
        <BarberHeader title={title} onOpenMobileSidebar={() => setMobileOpen(true)} />
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
