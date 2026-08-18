import { useContext } from 'react'
import { AdminThemeContext } from '@/context/AdminThemeContext'

export function useAdminTheme() {
  const ctx = useContext(AdminThemeContext)
  if (!ctx) throw new Error('useAdminTheme must be used within an AdminThemeProvider')
  return ctx
}
