import { Menu, ChevronsLeft, ChevronsRight, Sun, Moon } from 'lucide-react'
import { useAdminTheme } from '@/hooks/useAdminTheme'
import { useAuth } from '@/hooks/useAuth'
import { NotificationBell } from '@/components/admin/NotificationBell'

interface AdminHeaderProps {
  title: string
  collapsed: boolean
  onToggleCollapse: () => void
  onOpenMobileSidebar: () => void
}

export function AdminHeader({ title, collapsed, onToggleCollapse, onOpenMobileSidebar }: AdminHeaderProps) {
  const { theme, toggleTheme } = useAdminTheme()
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
        <button
          type="button"
          onClick={onToggleCollapse}
          className="hidden rounded-md p-2 text-[var(--admin-text-muted)] hover:bg-[var(--admin-surface-alt)] lg:inline-flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </button>
        <h1 className="text-base font-semibold text-[var(--admin-text)] sm:text-lg">{title}</h1>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <NotificationBell />

        <button
          type="button"
          onClick={toggleTheme}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--admin-border)] text-[var(--admin-text-muted)] transition-colors hover:bg-[var(--admin-surface-alt)]"
          aria-label="Toggle theme"
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="hidden items-center gap-2 rounded-full border border-[var(--admin-border)] py-1 pl-1 pr-3 sm:flex">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--admin-accent)] text-xs font-semibold text-white">
            {(user?.name ?? 'A').charAt(0).toUpperCase()}
          </span>
          <span className="max-w-[10rem] truncate text-sm font-medium text-[var(--admin-text)]">
            {user?.name ?? 'Admin'}
          </span>
        </div>
      </div>
    </header>
  )
}
