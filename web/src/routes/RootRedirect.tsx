import { Navigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { LoadingState } from '../components/LoadingState'

export function RootRedirect() {
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return <LoadingState label="Opening ProjectPulse..." />
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />
}
