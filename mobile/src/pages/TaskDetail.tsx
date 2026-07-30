import { useEffect, useState } from 'react'
import { useParams, useHistory } from 'react-router'
import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonPage,
  IonTextarea,
  IonTitle,
  IonToolbar,
  IonButton,
  IonText,
} from '@ionic/react'
import { getTaskDetail, updateTaskStatus, getTimeLogs, createTimeLog, type Task, type TimeLog } from '../services/taskService'

const statusLabels: Record<string, string> = {
  todo: 'To Do',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

function TaskDetail() {
  const { id } = useParams<{ id: string }>()
  const history = useHistory()
  const [task, setTask] = useState<Task | null>(null)
  const [logs, setLogs] = useState<TimeLog[]>([])
  const [loading, setLoading] = useState(true)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [duration, setDuration] = useState('')
  const [note, setNote] = useState('')
  const [logSubmitting, setLogSubmitting] = useState(false)
  const [logError, setLogError] = useState('')

  useEffect(() => {
    fetchTask()
  }, [id])

  const fetchTask = async () => {
    try {
      setLoading(true)
      const data = await getTaskDetail(Number(id))
      setTask(data)
      const timeLogs = await getTimeLogs(Number(id))
      setLogs(timeLogs)
    } catch {
      history.replace('/tasks')
    } finally {
      setLoading(false)
    }
  }

  const handleReportDone = async () => {
    if (statusUpdating || !task) return
    setStatusUpdating(true)
    try {
      const updated = await updateTaskStatus(task.id, 'done')
      setTask(updated)
    } catch {
      // silent
    } finally {
      setStatusUpdating(false)
    }
  }

  const handleAddLog = async () => {
    if (!task) return
    const mins = parseInt(duration, 10)
    if (!mins || mins < 1) {
      setLogError('Enter a valid duration (minutes)')
      return
    }
    setLogSubmitting(true)
    setLogError('')
    try {
      await createTimeLog(task.id, mins, note || undefined)
      setDuration('')
      setNote('')
      const timeLogs = await getTimeLogs(task.id)
      setLogs(timeLogs)
      // Refresh task to update total_logged_minutes
      const updated = await getTaskDetail(task.id)
      setTask(updated)
    } catch {
      setLogError('Failed to log time')
    } finally {
      setLogSubmitting(false)
    }
  }

  if (loading || !task) {
    return (
      <IonPage>
        <IonContent style={{ textAlign: 'center', padding: 48, color: '#999' }}>Loading...</IonContent>
      </IonPage>
    )
  }

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tasks" />
          </IonButtons>
          <IonTitle>Task Detail</IonTitle>
        </IonToolbar>
      </IonHeader>

      <IonContent className="ion-padding">
        <h2 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 4px', color: '#000' }}>{task.title}</h2>
        <p style={{ fontSize: 13, color: '#888', margin: '0 0 16px' }}>
          {task.project?.name}{task.project?.client ? ` \u00B7 ${task.project.client.name}` : ''}
        </p>

        {task.deadline && (
          <p style={{ fontSize: 13, color: '#666', marginBottom: 16 }}>
            Due: {task.deadline}
          </p>
        )}

        {task.description && (
          <p style={{ fontSize: 14, color: '#444', marginBottom: 24, lineHeight: 1.5 }}>
            {task.description}
          </p>
        )}

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 8 }}>Status</p>
          <span style={{
            display: 'inline-block',
            fontSize: 12,
            fontWeight: 600,
            padding: '4px 12px',
            borderRadius: 4,
            backgroundColor: task.status === 'done' ? '#000' : '#f0f0f0',
            color: task.status === 'done' ? '#fff' : '#333',
          }}>
            {statusLabels[task.status]}
          </span>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 4 }}>
            Total Logged: {Math.round(task.total_logged_minutes / 60)}h {task.total_logged_minutes % 60}m
          </p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 8 }}>Log Work Time</p>
          <IonList style={{ background: 'transparent' }}>
            <IonItem style={{ '--border-color': '#e5e5e5', marginBottom: 8 }}>
              <IonInput
                label="Duration (minutes)"
                labelPlacement="stacked"
                type="number"
                value={duration}
                onIonInput={(e) => setDuration(e.detail.value || '')}
                placeholder="e.g. 60"
              />
            </IonItem>
            <IonItem style={{ '--border-color': '#e5e5e5', marginBottom: 8 }}>
              <IonTextarea
                label="Note (optional)"
                labelPlacement="stacked"
                value={note}
                onIonInput={(e) => setNote(e.detail.value || '')}
                placeholder="What did you work on?"
                rows={2}
              />
            </IonItem>
          </IonList>
          {logError && <IonText color="medium"><p style={{ fontSize: 12, color: '#000', margin: '4px 0' }}>{logError}</p></IonText>}
          <IonButton
            expand="block"
            onClick={handleAddLog}
            disabled={logSubmitting}
            style={{
              '--background': '#000',
              '--border-radius': 8,
              height: 44,
              fontWeight: 600,
              marginTop: 8,
            }}
          >
            {logSubmitting ? 'Saving...' : 'Add Log'}
          </IonButton>
        </div>

        {task.status !== 'done' ? (
          <IonButton
            expand="block"
            onClick={handleReportDone}
            disabled={statusUpdating}
            style={{
              '--background': '#000',
              '--border-radius': 8,
              height: 44,
              fontWeight: 600,
              marginTop: 16,
            }}
          >
            {statusUpdating ? 'Reporting...' : 'Report Done'}
          </IonButton>
        ) : (
          <p style={{ fontSize: 13, color: '#666', textAlign: 'center', marginTop: 16, fontWeight: 500 }}>
            ✓ Task reported to admin
          </p>
        )}

        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 8 }}>Work History</p>
          {logs.length === 0 ? (
            <p style={{ fontSize: 13, color: '#999' }}>No time logs yet</p>
          ) : (
            logs.map((log) => (
              <div key={log.id} style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#000' }}>{log.duration_minutes}m</span>
                  <span style={{ fontSize: 11, color: '#888' }}>{log.work_date}</span>
                </div>
                {log.note && <p style={{ fontSize: 12, color: '#666', margin: '2px 0 0' }}>{log.note}</p>}
              </div>
            ))
          )}
        </div>
      </IonContent>
    </IonPage>
  )
}

export default TaskDetail
