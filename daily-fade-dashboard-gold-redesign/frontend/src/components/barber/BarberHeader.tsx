import { Menu } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface BarberHeaderProps {
  title: string
  onOpenMobileSidebar: () => void
}

export function BarberHeader({ title, onOpenMobileSidebar }: BarberHeaderProps) {
  const { user } = useAuth()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-surface)]/90 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          className="rounded-md p-2 text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-alt)] lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-base font-semibold text-[var(--admin-text)] sm:text-lg">{title}</h1>
      </div>

      <div className="hidden items-center gap-2 rounded-full border border-[var(--admin-border)] py-1 pl-1 pr-3 sm:flex">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--admin-accent)] text-xs font-semibold text-white">
          {(user?.name ?? 'B').charAt(0).toUpperCase()}
        </span>
        <span className="max-w-[10rem] truncate text-sm font-medium text-[var(--admin-text)]">
          {user?.name ?? 'Barber'}
        </span>
      </div>
    </header>
  )
}
