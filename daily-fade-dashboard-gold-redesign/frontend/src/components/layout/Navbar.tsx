import { useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { ChevronDown, User, CalendarCheck, Bell, Settings, LogOut, Scissors } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { Button } from '@/components/ui/Button'
import { Logo } from '@/components/brand/Logo'
import { NotificationBell } from '@/components/customer/NotificationBell'
import { cn } from '@/utils/cn'

const navLinks = [
  { to: '/', label: 'Home', end: true },
  { to: '/services', label: 'Services' },
  { to: '/barbers', label: 'Barbers' },
]

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [isAccountOpen, setIsAccountOpen] = useState(false)
  const accountRef = useRef<HTMLDivElement>(null)
  const { isAuthenticated, user, logout } = useAuth()
  const { showToast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!isAccountOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (accountRef.current && !accountRef.current.contains(e.target as Node)) {
        setIsAccountOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isAccountOpen])

  const handleLogout = async () => {
    await logout()
    showToast('Signed out. See you next time!', 'success')
    setIsOpen(false)
    setIsAccountOpen(false)
    navigate('/')
  }

  const accountMenuItems = [
    { to: '/profile', label: 'Profile', icon: User },
    { to: '/my-appointments', label: 'My Appointments', icon: CalendarCheck },
    { to: '/notifications', label: 'Notifications', icon: Bell },
    { to: '/profile', label: 'Settings', icon: Settings },
  ]

  // Header is always the dark noir/gold surface now — same tone as the
  // rest of the premium brand chrome (footer, dark hero bands).
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'relative py-1.5 text-sm font-medium tracking-wide transition-colors',
      isActive ? 'text-gold' : 'text-bone-soft hover:text-bone',
      // gold underline that grows in on active/hover instead of a flat color swap
      'after:absolute after:left-0 after:-bottom-[1px] after:h-px after:bg-gold after:transition-all after:duration-300',
      isActive ? 'after:w-full' : 'after:w-0 hover:after:w-full'
    )

  return (
    <header className="sticky top-0 z-40">
      <div className="border-b border-gold/15 bg-noir/95 shadow-[0_1px_0_0_rgba(0,0,0,0.4)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3.5">
          {/* Brand */}
          <NavLink to="/" className="group flex shrink-0 items-center transition-opacity hover:opacity-90">
            <Logo size={42} withWordmark dark />
          </NavLink>

          {/* Desktop nav — centered as its own flex region instead of
              clumping against the right edge, so the header reads as
              three balanced zones: brand / wayfinding / actions */}
          <nav className="hidden flex-1 items-center justify-center gap-9 md:flex">
            {navLinks.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end} className={linkClass}>
                {link.label}
              </NavLink>
            ))}
          </nav>

          {/* Actions zone */}
          <div className="hidden shrink-0 items-center gap-4 md:flex">
            {isAuthenticated ? (
              <>
                <NotificationBell dark />
                <div className="relative" ref={accountRef}>
                  <button
                    type="button"
                    onClick={() => setIsAccountOpen((v) => !v)}
                    aria-expanded={isAccountOpen}
                    aria-haspopup="menu"
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-transparent py-1 pl-1 pr-2 transition-colors hover:border-gold/20 hover:bg-white/[0.03]"
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border border-gold/30 bg-noir-raised font-display text-xs text-gold-bright">
                      {user?.name.charAt(0)}
                    </span>
                    <span className="hidden flex-col items-start leading-tight lg:flex">
                      <span className="text-sm text-bone">{user?.name.split(' ')[0]}</span>
                      <span className="font-mono text-[10px] uppercase tracking-wide text-bone-soft/70">
                        {user?.role}
                      </span>
                    </span>
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 text-bone-soft transition-transform',
                        isAccountOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {isAccountOpen && (
                    <div
                      role="menu"
                      className="absolute right-0 top-[calc(100%+10px)] w-56 overflow-hidden rounded-xl border border-line bg-canvas-raised shadow-card"
                    >
                      <div className="border-b border-line px-4 py-3">
                        <p className="font-display text-sm text-ink">{user?.name}</p>
                        <p className="font-mono text-[10px] uppercase tracking-wide text-ink-faint">Customer</p>
                      </div>
                      <div className="py-1.5">
                        {accountMenuItems.map((item) => (
                          <NavLink
                            key={item.label}
                            to={item.to}
                            onClick={() => setIsAccountOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-ink-soft transition-colors hover:bg-accent-soft/30 hover:text-ink"
                          >
                            <item.icon className="h-4 w-4 text-ink-faint" strokeWidth={1.75} />
                            {item.label}
                          </NavLink>
                        ))}
                      </div>
                      <div className="border-t border-line py-1.5">
                        <button
                          onClick={handleLogout}
                          className="flex w-full cursor-pointer items-center gap-2.5 px-4 py-2 text-left text-sm text-danger transition-colors hover:bg-danger/5"
                        >
                          <LogOut className="h-4 w-4" strokeWidth={1.75} />
                          Logout
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <NavLink
                  to="/login"
                  className="text-sm font-medium text-bone-soft transition-colors hover:text-bone"
                >
                  Login
                </NavLink>
                {/* Create Account now reads as a secondary button, not a
                    stray text link — gives Login/Create/Book a clear
                    visual order instead of three equal-weight labels */}
                <NavLink
                  to="/register"
                  className="rounded-lg border border-gold/30 px-3.5 py-1.5 text-sm font-medium text-gold-bright transition-colors hover:border-gold/60 hover:bg-gold/5"
                >
                  Create Account
                </NavLink>
              </div>
            )}

            <Button
              size="sm"
              className="bg-gold! text-noir! tracking-wide shadow-[0_4px_14px_-4px_rgba(212,175,55,0.5)] transition-all! duration-200 hover:bg-gold-bright! hover:shadow-[0_6px_18px_-4px_rgba(212,175,55,0.65)] hover:-translate-y-px"
              onClick={() => navigate('/book')}
            >
              <Scissors className="mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
              Book Appointment
            </Button>
          </div>

          {/* Mobile toggle */}
          <button
            className="flex cursor-pointer flex-col gap-1.5 md:hidden"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
            onClick={() => setIsOpen((v) => !v)}
          >
            <span className={cn('h-px w-6 bg-bone transition-transform', isOpen && 'translate-y-2 rotate-45')} />
            <span className={cn('h-px w-6 bg-bone transition-opacity', isOpen && 'opacity-0')} />
            <span className={cn('h-px w-6 bg-bone transition-transform', isOpen && '-translate-y-2 -rotate-45')} />
          </button>
        </div>

        {/* Mobile nav */}
        {isOpen && (
          <nav className="border-t border-gold/15 bg-noir px-6 pb-6 pt-4 md:hidden">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.end}
                  className={({ isActive }) =>
                    cn('text-sm tracking-wide transition-colors', isActive ? 'text-gold' : 'text-bone-soft hover:text-bone')
                  }
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </NavLink>
              ))}
              {isAuthenticated ? (
                <>
                  <NavLink
                    to="/my-appointments"
                    className="text-sm tracking-wide text-bone-soft hover:text-bone"
                    onClick={() => setIsOpen(false)}
                  >
                    My Appointments
                  </NavLink>
                  <NavLink
                    to="/notifications"
                    className="text-sm tracking-wide text-bone-soft hover:text-bone"
                    onClick={() => setIsOpen(false)}
                  >
                    Notifications
                  </NavLink>
                  <NavLink
                    to="/profile"
                    className="text-sm tracking-wide text-bone-soft hover:text-bone"
                    onClick={() => setIsOpen(false)}
                  >
                    Profile
                  </NavLink>
                  <div className="flex items-center gap-2 border-t border-gold/15 pt-4 font-mono text-xs uppercase tracking-wide text-bone-soft/70">
                    Signed in as {user?.name}
                  </div>
                  <button onClick={handleLogout} className="cursor-pointer text-left text-sm text-bone-soft hover:text-danger">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <NavLink
                    to="/login"
                    className="text-sm tracking-wide text-bone-soft hover:text-bone"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </NavLink>
                  <NavLink
                    to="/register"
                    className="w-fit rounded-lg border border-gold/30 px-3.5 py-1.5 text-sm font-medium text-gold-bright"
                    onClick={() => setIsOpen(false)}
                  >
                    Create Account
                  </NavLink>
                </>
              )}
              <Button
                size="sm"
                className="w-full bg-gold! text-noir! hover:bg-gold-bright!"
                onClick={() => {
                  setIsOpen(false)
                  navigate('/book')
                }}
              >
                <Scissors className="mr-1.5 h-3.5 w-3.5" strokeWidth={2} />
                Book Appointment
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}
