import { useState } from 'react'
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { useAuth } from '../services/AuthContext'
import { apiClient } from '../services/apiClient'

function Profile() {
  const { user, setUser, logout } = useAuth()
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) return
    setSaving(true)
    try {
      const res = await apiClient.put('/auth/profile', { name: name.trim() })
      setUser(res.data.data.user)
      setEditing(false)
    } catch {
      // silent
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setName(user?.name || '')
    setEditing(false)
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Profile</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 36,
              backgroundColor: '#e5e5e5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <span style={{ fontSize: 28, fontWeight: 700, color: '#666' }}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>

          {editing ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, flexDirection: 'column' }}>
              <IonInput
                value={name}
                onIonChange={(e) => setName(e.detail.value ?? '')}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: 8,
                  padding: '0 12px',
                  fontSize: 16,
                  maxWidth: 280,
                  textAlign: 'center',
                  '--padding-start': '12px',
                  '--padding-end': '12px',
                }}
              />
              <div style={{ display: 'flex', gap: 8 }}>
                <IonButton size="small" onClick={() => void handleSave()} disabled={saving || !name.trim()}>
                  {saving ? 'Saving...' : 'Save'}
                </IonButton>
                <IonButton size="small" fill="outline" onClick={handleCancel}>
                  Cancel
                </IonButton>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: '#000' }}>{user?.name}</h2>
                <IonButton size="small" fill="clear" onClick={() => setEditing(true)} style={{ '--padding-start': 4, '--padding-end': 4 }}>
                  <span style={{ fontSize: 14 }}>Edit</span>
                </IonButton>
              </div>
              <p style={{ margin: '4px 0 0', fontSize: 14, color: '#888' }}>{user?.email}</p>
            </div>
          )}
        </div>

        <IonList style={{ background: 'transparent', marginBottom: 32 }}>
          <IonItem style={{ '--border-color': '#e5e5e5' }}>
            <IonLabel>Role</IonLabel>
            <p slot="end" style={{ fontSize: 14, color: '#666' }}>{user?.role}</p>
          </IonItem>
          {user?.profession && (
            <IonItem style={{ '--border-color': '#e5e5e5' }}>
              <IonLabel>Profession</IonLabel>
              <p slot="end" style={{ fontSize: 14, color: '#666' }}>{user.profession}</p>
            </IonItem>
          )}
        </IonList>

        <IonButton
          expand="block"
          onClick={() => void logout()}
          style={{
            '--background': '#000',
            '--border-radius': 8,
            height: 48,
            fontWeight: 600,
          }}
        >
          Log Out
        </IonButton>
      </IonContent>
    </IonPage>
  )
}

export default Profile
