import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

/**
 * Guards every /admin/* page except /admin/login.
 *
 * This is a frontend convenience only — the real enforcement happens in
 * Laravel via the `role:admin` middleware on every /api/admin/* route,
 * which returns 403 for any non-admin regardless of what the frontend
 * does. This guard just avoids flashing admin UI at someone who isn't
 * going to be able to load any of its data anyway.
 */
export function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, role } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0b0e14] text-slate-300">
        <div className="flex items-center gap-3 text-sm">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Checking session…
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  // Authenticated, but as a Customer or Barber — send them to a proper
  // unauthorized page rather than back to the admin login form, which
  // would misleadingly suggest logging in again could grant access.
  if (role !== 'admin') {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
