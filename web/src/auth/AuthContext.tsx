import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { getApiErrorDetails } from '../utils/apiError'
import { getCurrentUser, loginAdmin, logout as logoutRequest } from '../services/authService'
import {
  clearStoredAdminToken,
  getStoredAdminToken,
  storeAdminToken,
} from '../services/tokenStorage'
import type { AuthenticatedUser } from '../types/auth'

interface AuthErrorState {
  message: string
  fieldErrors?: Record<string, string[]>
}

interface LoginCredentials {
  email: string
  password: string
}

interface AuthContextValue {
  user: AuthenticatedUser | null
  isAuthenticated: boolean
  isInitializing: boolean
  isLoggingIn: boolean
  authError: AuthErrorState | null
  login: (credentials: LoginCredentials) => Promise<boolean>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
  clearAuthError: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function adminOnly(user: AuthenticatedUser): boolean {
  return user.role === 'admin'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthenticatedUser | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [authError, setAuthError] = useState<AuthErrorState | null>(null)

  const clearAuthState = useCallback(() => {
    clearStoredAdminToken()
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    const token = getStoredAdminToken()

    if (!token) {
      setUser(null)
      return
    }

    try {
      const currentUser = await getCurrentUser()

      if (!adminOnly(currentUser.user)) {
        clearAuthState()
        setAuthError({
          message: 'This web admin area is only available to administrator accounts.',
        })
        return
      }

      setUser(currentUser.user)
    } catch (error) {
      const details = getApiErrorDetails(error)
      clearAuthState()
      setAuthError({ message: details.message, fieldErrors: details.fieldErrors })
    }
  }, [clearAuthState])

  useEffect(() => {
    let isMounted = true

    async function initializeAuth() {
      await refreshUser()

      if (isMounted) {
        setIsInitializing(false)
      }
    }

    void initializeAuth()

    return () => {
      isMounted = false
    }
  }, [refreshUser])

  const login = useCallback(
    async (credentials: LoginCredentials) => {
      setIsLoggingIn(true)
      setAuthError(null)

      try {
        const loginData = await loginAdmin(credentials)

        if (!adminOnly(loginData.user)) {
          clearAuthState()
          setAuthError({
            message: 'This web admin area is only available to administrator accounts.',
          })
          return false
        }

        storeAdminToken(loginData.token)
        setUser(loginData.user)
        return true
      } catch (error) {
        const details = getApiErrorDetails(error)
        clearAuthState()
        setAuthError({ message: details.message, fieldErrors: details.fieldErrors })
        return false
      } finally {
        setIsLoggingIn(false)
      }
    },
    [clearAuthState],
  )

  const logout = useCallback(async () => {
    try {
      if (getStoredAdminToken()) {
        await logoutRequest()
      }
    } catch {
      // A failed logout request should still clear the local session.
    } finally {
      clearAuthState()
    }
  }, [clearAuthState])

  const clearAuthError = useCallback(() => {
    setAuthError(null)
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user?.role === 'admin',
      isInitializing,
      isLoggingIn,
      authError,
      login,
      logout,
      refreshUser,
      clearAuthError,
    }),
    [authError, clearAuthError, isInitializing, isLoggingIn, login, logout, refreshUser, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.')
  }

  return context
}
