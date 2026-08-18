import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type AdminTheme = 'light' | 'dark'

const STORAGE_KEY = 'admin_theme'

interface AdminThemeContextValue {
  theme: AdminTheme
  setTheme: (theme: AdminTheme) => void
  toggleTheme: () => void
}

export const AdminThemeContext = createContext<AdminThemeContextValue | undefined>(undefined)

function getInitialTheme(): AdminTheme {
  if (typeof window === 'undefined') return 'dark'

  const stored = window.localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark') return stored

  return 'dark'
}

export function AdminThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<AdminTheme>(getInitialTheme)

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const value = useMemo<AdminThemeContextValue>(
    () => ({
      theme,
      setTheme: setThemeState,
      toggleTheme: () => setThemeState((t) => (t === 'light' ? 'dark' : 'light')),
    }),
    [theme]
  )

  return <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>
}
