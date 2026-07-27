export function LoginPage() {
  return (
    <section className="page page--narrow" aria-labelledby="login-heading">
      <p className="eyebrow">Administration</p>
      <h1 id="login-heading">Sign in to ProjectPulse</h1>
      <p className="page-intro">
        Authentication is intentionally not configured during the setup phase.
      </p>
      <form className="placeholder-form">
        <fieldset disabled>
          <label htmlFor="email">Email address</label>
          <input id="email" type="email" placeholder="you@example.com" autoComplete="email" />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" placeholder="Your password" autoComplete="current-password" />
          <button className="button" type="submit">
            Sign in
          </button>
        </fieldset>
      </form>
    </section>
  )
}
