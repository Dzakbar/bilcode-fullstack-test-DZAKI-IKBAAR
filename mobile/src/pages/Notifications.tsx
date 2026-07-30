import { useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import {
  IonBadge,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { getNotifications, markAsRead } from '../services/notificationService'
import type { Notification } from '../services/notificationService'

function Notifications() {
  const history = useHistory()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      const data = await getNotifications()
      setNotifications(data.data)
      setUnreadCount(data.meta.unread_count)
    } catch {
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async (event: CustomEvent) => {
    await fetchNotifications()
    event.detail.complete()
  }

  const handleTap = async (n: Notification) => {
    if (!n.read_at) {
      await markAsRead(n.id)
      setNotifications((prev) =>
        prev.map((x) => (x.id === n.id ? { ...x, read_at: new Date().toISOString() } : x)),
      )
      setUnreadCount((c) => Math.max(0, c - 1))
    }
    if (n.task_id) {
      history.push(`/tasks/${n.task_id}`)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>Notifications</IonTitle>
          {unreadCount > 0 && (
            <IonBadge slot="end" style={{ marginRight: 16, backgroundColor: '#000', color: '#fff' }}>
              {unreadCount}
            </IonBadge>
          )}
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>Loading...</div>
        ) : notifications.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
            <p>No notifications</p>
          </div>
        ) : (
          <IonList>
            {notifications.map((n) => (
              <IonItem
                key={n.id}
                button
                onClick={() => handleTap(n)}
                style={{
                  '--padding-start': 16,
                  '--inner-padding-end': 16,
                  backgroundColor: n.read_at ? 'transparent' : '#f8f8f8',
                }}
              >
                <IonLabel>
                  <p style={{ fontSize: 12, color: '#888', margin: 0 }}>{n.type.replace('_', ' ')}</p>
                  <h3 style={{ fontSize: 15, fontWeight: n.read_at ? 400 : 600, margin: '2px 0', color: '#000' }}>{n.message}</h3>
                  <p style={{ fontSize: 11, color: '#999', margin: 0 }}>{formatDate(n.created_at)}</p>
                </IonLabel>
                {!n.read_at && (
                  <div style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#000', marginLeft: 8 }} />
                )}
              </IonItem>
            ))}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  )
}

export default Notifications
