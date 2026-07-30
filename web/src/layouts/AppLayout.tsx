import { Outlet } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { Button } from '../components/Button'
import { SidebarNavItem } from '../components/SidebarNavItem'

export function AppLayout() {
  const { logout, user } = useAuth()

  return (
    <div className="admin-shell">
      <aside className="sidebar" aria-label="Admin navigation">
        <div>
          <a className="brand" href="/dashboard" aria-label="ProjectPulse dashboard">
            ProjectPulse
          </a>
          <p className="sidebar-kicker">Admin web</p>
        </div>
        <nav className="sidebar-nav" aria-label="Primary navigation">
          <SidebarNavItem label="Dashboard" to="/dashboard" />
          <SidebarNavItem label="Clients" to="/clients" />
          <SidebarNavItem label="Projects" to="/projects" />
          <SidebarNavItem label="Tasks" to="/tasks" />
          <SidebarNavItem label="AI Breakdown" to="/ai/breakdown" />
          <SidebarNavItem label="Reports" to="/reports" />
        </nav>
      </aside>
      <div className="admin-content">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Dashboard</p>
            <p className="admin-header__title">ProjectPulse administration</p>
          </div>
          <div className="admin-header__account">
            <div>
              <strong>{user?.name}</strong>
              <span>{user?.role}</span>
            </div>
            <Button type="button" variant="secondary" onClick={() => void logout()}>
              Log out
            </Button>
          </div>
        </header>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
