import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/Button'

/**
 * Shown when an authenticated user tries to reach an area their role
 * doesn't allow (e.g. a Customer or Barber hitting /admin/*). This is a
 * distinct case from "not logged in" — those are sent to the relevant
 * login page instead. See AdminRoute / BarberRoute.
 */
export function Unauthorized() {
  const { role } = useAuth()

  const homeHref = role === 'admin' ? '/admin' : role === 'barber' ? '/barber' : '/'

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger/10 text-danger">
        <ShieldAlert className="h-6 w-6" />
      </span>
      <p className="mt-4 font-display text-3xl text-ink">403 — Unauthorized</p>
      <p className="mt-3 text-ink-soft">
        Your account doesn't have permission to view that page.
      </p>
      <Link to={homeHref} className="mt-8">
        <Button>Back to safety</Button>
      </Link>
    </div>
  )
}
