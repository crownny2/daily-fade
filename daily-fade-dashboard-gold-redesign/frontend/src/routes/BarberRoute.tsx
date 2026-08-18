import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

/**
 * Guards /barber/*. Same shape as AdminRoute: unauthenticated users go to
 * the shared login page, authenticated users with the wrong role get an
 * Unauthorized page instead of a silent redirect loop. As with AdminRoute,
 * this is a UX convenience — Laravel's `role:barber` middleware is what
 * actually protects /api/barber/* regardless of what the frontend does.
 */
export function BarberRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, role } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingSpinner label="Checking session…" />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (role !== 'barber') {
    return <Navigate to="/unauthorized" replace />
  }

  return <>{children}</>
}
