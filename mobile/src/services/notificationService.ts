import { apiClient } from './apiClient'

export interface Notification {
  id: number
  user_id: number
  task_id: number | null
  type: string
  message: string
  read_at: string | null
  created_at: string
  task?: { id: number; title: string } | null
}

export async function getNotifications(): Promise<{ data: Notification[]; meta: { unread_count: number } }> {
  const response = await apiClient.get('/mobile/notifications')
  return response.data
}

export async function markAsRead(id: number): Promise<void> {
  await apiClient.patch(`/mobile/notifications/${id}/read`)
}
