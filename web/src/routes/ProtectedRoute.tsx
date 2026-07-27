import { Outlet } from 'react-router'

/**
 * Authentication is deliberately deferred. This boundary keeps future protected
 * routes grouped without introducing a temporary or fake authentication flow.
 */
export function ProtectedRoute() {
  return <Outlet />
}
