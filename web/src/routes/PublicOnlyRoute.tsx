import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { LoadingState } from '../components/LoadingState'

export function PublicOnlyRoute() {
  const { isAuthenticated, isInitializing } = useAuth()

  if (isInitializing) {
    return <LoadingState label="Checking your session..." />
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
