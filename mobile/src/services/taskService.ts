import { apiClient } from './apiClient'

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskCategory = 'frontend' | 'backend' | 'design' | 'qa'

export interface Task {
  id: number
  title: string
  description: string | null
  category: TaskCategory
  estimated_effort: number | null
  deadline: string | null
  status: TaskStatus
  project: {
    id: number
    name: string
    client?: { id: number; name: string; company?: string }
  } | null
  assignee: { id: number; name: string; email: string; profession?: string } | null
  progress_logs_count: number
  time_logs_count: number
  total_logged_minutes: number
  created_at: string
  updated_at: string
}

export interface TimeLog {
  id: number
  task_id: number
  user_id: number
  work_date: string
  duration_minutes: number
  note: string | null
  created_at: string
}

export async function getMyTasks(status?: string): Promise<Task[]> {
  const params: Record<string, string> = {}
  if (status) params.status = status
  const response = await apiClient.get('/mobile/tasks', { params })
  return response.data.data
}

export async function getTaskDetail(id: number): Promise<Task> {
  const response = await apiClient.get(`/mobile/tasks/${id}`)
  return response.data.data
}

export async function updateTaskStatus(id: number, status: TaskStatus): Promise<Task> {
  const response = await apiClient.patch(`/mobile/tasks/${id}/status`, { status })
  return response.data.data
}

export async function getTimeLogs(taskId: number): Promise<TimeLog[]> {
  const response = await apiClient.get(`/mobile/tasks/${taskId}/time-logs`)
  return response.data.data
}

export async function createTimeLog(taskId: number, duration_minutes: number, note?: string): Promise<TimeLog> {
  const response = await apiClient.post(`/mobile/tasks/${taskId}/time-logs`, {
    duration_minutes,
    note: note || null,
  })
  return response.data.data
}
