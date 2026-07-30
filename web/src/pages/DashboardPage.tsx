import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { PageHeader } from '../components/PageHeader'
import { getDashboardSummary, type DashboardSummary } from '../services/dashboardService'

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  planning: 'Planning',
  active: 'Active',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export function DashboardPage() {
  const { user } = useAuth()
  const [data, setData] = useState<DashboardSummary | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchSummary()
  }, [])

  const fetchSummary = async () => {
    try {
      setLoading(true)
      const result = await getDashboardSummary()
      setData(result)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  if (loading || !data) {
    return (
      <section className="page dashboard-page" aria-labelledby="dashboard-heading">
        <PageHeader
          eyebrow="Administration"
          title={`Welcome, ${user?.name ?? 'admin'}`}
          description="Loading dashboard data..."
        />
      </section>
    )
  }

  const { stats, recent_time_logs, member_workload } = data

  return (
    <section className="page dashboard-page" aria-labelledby="dashboard-heading">
      <PageHeader
        eyebrow="Administration"
        title={`Welcome, ${user?.name ?? 'admin'}`}
        description="ProjectPulse business overview at a glance."
      />

      <div className="status-grid" style={{ marginBottom: '2rem' }}>
        <article className="status-card">
          <span>Total Clients</span>
          <strong>{stats.total_clients}</strong>
          <p>Registered client companies</p>
        </article>
        <article className="status-card">
          <span>Total Projects</span>
          <strong>{stats.total_projects}</strong>
          <p>
            {stats.projects_by_status.active} active, {stats.projects_by_status.planning} planning
          </p>
        </article>
        <article className="status-card">
          <span>Total Tasks</span>
          <strong>{stats.total_tasks}</strong>
          <p>
            {stats.tasks_by_status.todo} todo, {stats.tasks_by_status.in_progress} in progress, {stats.tasks_by_status.review} review, {stats.tasks_by_status.done} done
          </p>
        </article>
        <article className="status-card">
          <span>Tasks Overdue</span>
          <strong style={{ color: stats.tasks_overdue > 0 ? '#b91c1c' : '#111' }}>{stats.tasks_overdue}</strong>
          <p>Past deadline & not yet completed</p>
        </article>
        <article className="status-card">
          <span>Completed</span>
          <strong>{stats.tasks_by_status.done}</strong>
          <p>Tasks reported done by members</p>
        </article>
        <article className="status-card">
          <span>Team Members</span>
          <strong>{stats.total_members}</strong>
          <p>Available developers & designers</p>
        </article>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
        <article className="status-card">
          <span>Tasks by Status</span>
          <div style={{ marginTop: '1rem' }}>
            {Object.entries(stats.tasks_by_status).map(([key, count]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ flex: 1, fontSize: '0.875rem', color: '#5f5f5f' }}>{statusLabels[key] || key}</span>
                <div style={{ flex: 2, height: 8, borderRadius: 4, background: '#ececec', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${stats.total_tasks > 0 ? (count / stats.total_tasks) * 100 : 0}%`,
                      height: '100%',
                      borderRadius: 4,
                      background: '#171717',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', minWidth: 24, textAlign: 'right' }}>{count}</span>
              </div>
            ))}
          </div>
        </article>

        <article className="status-card">
          <span>Projects by Status</span>
          <div style={{ marginTop: '1rem' }}>
            {Object.entries(stats.projects_by_status).map(([key, count]) => (
              <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                <span style={{ flex: 1, fontSize: '0.875rem', color: '#5f5f5f' }}>{statusLabels[key] || key}</span>
                <div style={{ flex: 2, height: 8, borderRadius: 4, background: '#ececec', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${stats.total_projects > 0 ? (count / stats.total_projects) * 100 : 0}%`,
                      height: '100%',
                      borderRadius: 4,
                      background: '#555',
                      transition: 'width 0.3s',
                    }}
                  />
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.875rem', minWidth: 24, textAlign: 'right' }}>{count}</span>
              </div>
            ))}
          </div>
        </article>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member Report</th>
                <th>Task</th>
                <th>Duration</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recent_time_logs.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#707070', padding: '2rem' }}>No time logs yet</td></tr>
              ) : (
                recent_time_logs.map((log) => (
                  <tr key={log.id}>
                    <td><strong>{log.member_name}</strong></td>
                    <td>
                      {log.task_title}
                      <div style={{ fontSize: '0.75rem', color: '#707070' }}>{log.project_name}</div>
                    </td>
                    <td>{log.duration_minutes}m</td>
                    <td>{log.work_date}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="table-shell">
          <table className="data-table">
            <thead>
              <tr>
                <th>Member</th>
                <th>Profession</th>
                <th>Tasks</th>
                <th>Hours</th>
              </tr>
            </thead>
            <tbody>
              {member_workload.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: 'center', color: '#707070', padding: '2rem' }}>No members found</td></tr>
              ) : (
                member_workload.map((m) => (
                  <tr key={m.id}>
                    <td><strong>{m.name}</strong></td>
                    <td style={{ textTransform: 'capitalize' }}>{m.profession || '-'}</td>
                    <td>{m.assigned_tasks}</td>
                    <td>{m.total_logged_hours}h</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  )
}
