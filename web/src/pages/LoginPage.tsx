import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useAuth } from '../auth/AuthContext'
import { Alert } from '../components/Alert'
import { Button } from '../components/Button'
import { PasswordInput } from '../components/PasswordInput'
import { TextInput } from '../components/TextInput'

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { authError, clearAuthError, isLoggingIn, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [localErrors, setLocalErrors] = useState<Record<string, string>>({})

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    clearAuthError()

    const errors: Record<string, string> = {}

    if (!email.trim()) {
      errors.email = 'Email is required.'
    }

    if (!password) {
      errors.password = 'Password is required.'
    }

    setLocalErrors(errors)

    if (Object.keys(errors).length > 0) {
      return
    }

    const wasSuccessful = await login({ email: email.trim(), password })

    if (wasSuccessful) {
      const state = location.state as { from?: { pathname?: string } } | null
      navigate(state?.from?.pathname ?? '/dashboard', { replace: true })
    }
  }

  function getFieldError(field: string): string | undefined {
    return localErrors[field] ?? authError?.fieldErrors?.[field]?.[0]
  }

  return (
    <main className="login-shell">
      <section className="login-card" aria-labelledby="login-heading">
        <p className="eyebrow">Administration</p>
        <h1 id="login-heading">Sign in to ProjectPulse</h1>
        <p className="page-intro">
          Use an administrator account to access the protected setup dashboard.
        </p>
        {authError ? (
          <Alert title="Sign-in failed">
            <p>{authError.message}</p>
          </Alert>
        ) : null}
        <form className="auth-form" onSubmit={(event) => void handleSubmit(event)} noValidate>
          <TextInput
            autoComplete="email"
            error={getFieldError('email')}
            label="Email"
            name="email"
            onChange={(event) => {
              setEmail(event.target.value)
              setLocalErrors((current) => ({ ...current, email: '' }))
              clearAuthError()
            }}
            placeholder="admin@example.com"
            required
            type="email"
            value={email}
          />
          <PasswordInput
            error={getFieldError('password')}
            label="Password"
            name="password"
            onChange={(event) => {
              setPassword(event.target.value)
              setLocalErrors((current) => ({ ...current, password: '' }))
              clearAuthError()
            }}
            value={password}
          />
          <Button className="auth-form__submit" isLoading={isLoggingIn} type="submit">
            Sign in
          </Button>
          <p className="form-help">Local test credentials are documented in the project README.</p>
        </form>
      </section>
    </main>
  )
}
