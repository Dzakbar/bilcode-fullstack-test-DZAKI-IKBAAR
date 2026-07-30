import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { clearStoredToken, getStoredToken, storeToken } from './tokenStorage'
import { getCurrentUser, loginMember, logoutRequest } from './authService'
import type { AuthenticatedUser } from './authService'

interface AuthContextValue {
  user: AuthenticatedUser | null
  isAuthenticated: boolean
  isInitializing: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  logout: () => Promise<void>
  setUser: (user: AuthenticatedUser | null) => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setIsInitializing(false)
      return
    }
    try {
      const data = await getCurrentUser()
      setUser(data.user)
    } catch {
      clearStoredToken()
    } finally {
      setIsInitializing(false)
    }
  }, [])

  useEffect(() => {
    void refreshUser()
  }, [refreshUser])

  const login = useCallback(async (email: string, password: string) => {
    try {
      const data = await loginMember(email, password)
      storeToken(data.token)
      setUser(data.user)
      return { success: true }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Login failed'
      return { success: false, error: msg }
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      if (getStoredToken()) await logoutRequest()
    } catch {
      // silent
    } finally {
      clearStoredToken()
      setUser(null)
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: !!user, isInitializing, login, logout, setUser }),
    [user, isInitializing, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
