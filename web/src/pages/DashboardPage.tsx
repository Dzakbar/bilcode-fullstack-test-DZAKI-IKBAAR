import { useAuth } from '../auth/AuthContext'
import { PageHeader } from '../components/PageHeader'

const setupCards = [
  {
    label: 'Backend API',
    value: 'Connected',
    description: 'The admin web shell is configured to call the Laravel API.',
  },
  {
    label: 'Authentication',
    value: 'Active',
    description: 'Bearer-token login, session restoration, and logout are wired.',
  },
  {
    label: 'Client Management',
    value: 'Active',
    description: 'Client CRUD screens are connected to the Laravel admin API.',
  },
  {
    label: 'Project Management',
    value: 'Active',
    description: 'Project CRUD screens are connected to the Laravel admin API.',
  },
  {
    label: 'Task Management',
    value: 'Next phase',
    description: 'Task CRUD UI and Kanban views are out of scope for now.',
  },
]

export function DashboardPage() {
  const { user } = useAuth()

  return (
    <section className="page dashboard-page" aria-labelledby="dashboard-heading">
      <PageHeader
        eyebrow="Administration"
        title={`Welcome, ${user?.name ?? 'admin'}`}
        description="The protected dashboard foundation is ready. Business data cards will be connected in later phases."
      />
      <section className="status-grid" aria-label="Setup status">
        {setupCards.map((card) => (
          <article className="status-card" key={card.label}>
            <span>{card.label}</span>
            <strong>{card.value}</strong>
            <p>{card.description}</p>
          </article>
        ))}
      </section>
    </section>
  )
}
