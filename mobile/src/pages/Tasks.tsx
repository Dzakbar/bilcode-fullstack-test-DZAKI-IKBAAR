import { useEffect, useState } from 'react'
import { useHistory } from 'react-router'
import {
  IonBadge,
  IonButtons,
  IonContent,
  IonHeader,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  IonText,
  IonTitle,
  IonToolbar,
} from '@ionic/react'
import { useAuth } from '../services/AuthContext'
import { getMyTasks } from '../services/taskService'
import type { Task, TaskStatus } from '../services/taskService'

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

const statusColors: Record<string, { bg: string; text: string }> = {
  todo: { bg: '#f0f0f0', text: '#333' },
  in_progress: { bg: '#e0e0e0', text: '#000' },
  review: { bg: '#d0d0d0', text: '#000' },
  done: { bg: '#000', text: '#fff' },
}

function Tasks() {
  const history = useHistory()
  const { user } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [segment, setSegment] = useState<string>('all')

  useEffect(() => {
    fetchTasks()
  }, [segment])

  const fetchTasks = async () => {
    try {
      setLoading(true)
      const status = segment === 'all' ? undefined : segment
      const data = await getMyTasks(status)
      setTasks(data)
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async (event: CustomEvent) => {
    await fetchTasks()
    event.detail.complete()
  }

  const activeCount = tasks.filter((t) => t.status !== 'done').length

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>My Tasks</IonTitle>
          <IonButtons slot="end">
            <IonText style={{ fontSize: 12, color: '#666', marginRight: 16 }}>
              {activeCount} active
            </IonText>
          </IonButtons>
        </IonToolbar>
        <IonToolbar>
          <IonSegment value={segment} onIonChange={(e) => { const v = e.detail.value; if (v) setSegment(String(v)) }} style={{ padding: '0 8px 8px' }}>
            <IonSegmentButton value="all">All</IonSegmentButton>
            <IonSegmentButton value="todo">To Do</IonSegmentButton>
            <IonSegmentButton value="in_progress">Active</IonSegmentButton>
            <IonSegmentButton value="review">Review</IonSegmentButton>
            <IonSegmentButton value="done">Done</IonSegmentButton>
          </IonSegment>
        </IonToolbar>
      </IonHeader>

      <IonContent>
        <IonRefresher slot="fixed" onIonRefresh={handleRefresh}>
          <IonRefresherContent />
        </IonRefresher>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>Loading...</div>
        ) : tasks.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: '#999' }}>
            <p>No tasks found</p>
          </div>
        ) : (
          <IonList>
            {tasks.map((task) => {
              const sc = statusColors[task.status]
              return (
                <IonItem
                  key={task.id}
                  button
                  onClick={() => history.push(`/tasks/${task.id}`)}
                  style={{ '--padding-start': 16, '--inner-padding-end': 16, marginBottom: 2 }}
                >
                  <div style={{ width: '100%', padding: '8px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <IonLabel>
                        <p style={{ fontSize: 12, color: '#888', margin: 0, marginBottom: 2 }}>
                          {task.project?.name || 'No project'}
                        </p>
                        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: '#000' }}>{task.title}</h3>
                      </IonLabel>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 4,
                          backgroundColor: sc.bg,
                          color: sc.text,
                        }}
                      >
                        {statusLabels[task.status]}
                      </span>
                      {task.deadline && (
                        <span style={{ fontSize: 11, color: '#888' }}>&#128197; {task.deadline}</span>
                      )}
                      {task.total_logged_minutes > 0 && (
                        <span style={{ fontSize: 11, color: '#888' }}>
                          {Math.round(task.total_logged_minutes / 60)}h
                        </span>
                      )}
                    </div>
                  </div>
                </IonItem>
              )
            })}
          </IonList>
        )}
      </IonContent>
    </IonPage>
  )
}

export default Tasks
