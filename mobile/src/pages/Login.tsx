import { useState } from 'react'
import { IonContent, IonPage, IonInput, IonButton, IonText, IonItem, IonList } from '@ionic/react'
import { useAuth } from '../services/AuthContext'

function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('developer1@projectpulse.test')
  const [password, setPassword] = useState('password')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Email and password are required.')
      return
    }
    setLoading(true)
    const result = await login(email.trim(), password)
    setLoading(false)
    if (!result.success) setError(result.error || 'Login failed')
  }

  return (
    <IonPage>
      <IonContent className="ion-padding" style={{ '--background': '#ffffff' }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            minHeight: '100%',
            maxWidth: 360,
            margin: '0 auto',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: '-0.5px' }}>ProjectPulse</h1>
            <p style={{ marginTop: 8, color: '#666', fontSize: 14 }}>Member workspace</p>
          </div>

          <form onSubmit={handleSubmit}>
            <IonList style={{ background: 'transparent' }}>
              <IonItem style={{ marginBottom: 16, '--border-color': '#e5e5e5' }}>
                <IonInput
                  label="Email"
                  labelPlacement="floating"
                  type="email"
                  value={email}
                  onIonInput={(e) => setEmail(e.detail.value || '')}
                  required
                />
              </IonItem>
              <IonItem style={{ marginBottom: 24, '--border-color': '#e5e5e5' }}>
                <IonInput
                  label="Password"
                  labelPlacement="floating"
                  type="password"
                  value={password}
                  onIonInput={(e) => setPassword(e.detail.value || '')}
                  required
                />
              </IonItem>
            </IonList>

            {error && (
              <IonText color="medium">
                <p style={{ color: '#000', fontSize: 13, marginTop: -8, marginBottom: 16 }}>{error}</p>
              </IonText>
            )}

            <IonButton
              expand="block"
              type="submit"
              disabled={loading}
              style={{
                '--background': '#000',
                '--border-radius': 8,
                height: 48,
                fontWeight: 600,
              }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </IonButton>
          </form>

          <p style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#999' }}>
            Use your member account credentials
          </p>
        </div>
      </IonContent>
    </IonPage>
  )
}

export default Login
