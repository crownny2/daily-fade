import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { TOKEN_STORAGE_KEY, onUnauthorized } from '@/api/client'
import * as authApi from '@/api/auth'
import type { LoginPayload, RegisterPayload } from '@/api/auth'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  role: User['role'] | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<User>
  register: (payload: RegisterPayload) => Promise<User>
  logout: () => Promise<void>
  /** Patches the in-memory user (e.g. after Admin Profile save) without a full re-login. */
  updateUser: (patch: Partial<User>) => void
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setUser(null)
  }, [])

  useEffect(() => {
    onUnauthorized(clearSession)
  }, [clearSession])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY)
    if (!token) {
      setIsLoading(false)
      return
    }
    authApi
      .fetchCurrentUser()
      .then(setUser)
      .catch(clearSession)
      .finally(() => setIsLoading(false))
  }, [clearSession])

  const login = useCallback(async (payload: LoginPayload) => {
    const { user: loggedInUser, token } = await authApi.login(payload)
    localStorage.setItem(TOKEN_STORAGE_KEY, token)
    setUser(loggedInUser)
    return loggedInUser
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    // Registration only creates the account — it does not start a session.
    // The Register page sends the person to /login afterwards, where they
    // sign in with the credentials they just chose.
    const { user: newUser } = await authApi.register(payload)
    return newUser
  }, [])

  const logout = useCallback(async () => {
    try {
      await authApi.logout()
    } finally {
      clearSession()
    }
  }, [clearSession])

  const updateUser = useCallback((patch: Partial<User>) => {
    setUser((current) => (current ? { ...current, ...patch } : current))
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAuthenticated: user !== null,
      isLoading,
      login,
      register,
      logout,
      updateUser,
    }),
    [user, isLoading, login, register, logout, updateUser]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
