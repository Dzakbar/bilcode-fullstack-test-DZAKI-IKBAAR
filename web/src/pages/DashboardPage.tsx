export function DashboardPage() {
  return (
    <section className="page" aria-labelledby="dashboard-heading">
      <p className="eyebrow">Administration</p>
      <h1 id="dashboard-heading">Dashboard</h1>
      <p className="page-intro">
        The web foundation is ready. Dashboard metrics and business data will be added in a later phase.
      </p>
      <section className="placeholder-panel" aria-labelledby="setup-heading">
        <h2 id="setup-heading">Setup status</h2>
        <p>Routing, API-client, loading, and error-state foundations are available for future screens.</p>
      </section>
    </section>
  )
}
