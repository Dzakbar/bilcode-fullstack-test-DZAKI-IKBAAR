import { Link } from 'react-router'

export function NotFoundPage() {
  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="not-found-heading">
      <p className="eyebrow">404</p>
      <h1 id="not-found-heading">Page not found</h1>
      <p className="page-intro">The page you requested is not part of this setup shell.</p>
      <Link className="button" to="/dashboard">
        Go to dashboard
      </Link>
    </section>
    </main>
  )
}
