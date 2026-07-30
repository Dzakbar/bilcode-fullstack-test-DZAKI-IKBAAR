import { apiClient } from './apiClient'
import type { ApiPaginatedResponse, ApiSuccessResponse } from '../types/api'

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskCategory = 'frontend' | 'backend' | 'design' | 'qa'

export interface Task {
  id: number
  title: string
  description: string | null
  project_id: number
  assignee_id: number | null
  category: TaskCategory
  estimated_effort: number | null
  deadline: string | null
  status: TaskStatus
  total_logged_minutes: number
  assignee?: {
    id: number
    name: string
    email: string
    profession?: string
  } | null
  project: {
    id: number
    name: string
    client?: {
      id: number
      name: string
    }
  }
  created_at: string
  updated_at: string
}

export type TaskFormData = {
  title: string
  description?: string
  project_id: number | string
  assignee_id?: number | string | null
  category: TaskCategory
  estimated_effort?: number | string
  deadline?: string
  status: TaskStatus
}

type TaskPayload = {
  title: string
  description?: string | null
  project_id: number
  assignee_id?: number | null
  category: TaskCategory
  estimated_effort?: number | null
  deadline?: string | null
  status: TaskStatus
}

function toPayload(data: TaskFormData): TaskPayload {
  return {
    title: data.title.trim(),
    description: data.description ? data.description.trim() : null,
    project_id: Number(data.project_id),
    assignee_id: data.assignee_id ? Number(data.assignee_id) : null,
    category: data.category,
    estimated_effort: data.estimated_effort ? Number(data.estimated_effort) : null,
    deadline: data.deadline || null,
    status: data.status,
  }
}

export async function getTasks(params?: Record<string, string | number>): Promise<ApiPaginatedResponse<Task>> {
  const response = await apiClient.get<ApiPaginatedResponse<Task>>('/admin/tasks', { params })
  return response.data
}

export async function getTask(id: string | number): Promise<Task> {
  const response = await apiClient.get<ApiSuccessResponse<Task>>(`/admin/tasks/${id}`)
  return response.data.data
}

export async function createTask(data: TaskFormData): Promise<Task> {
  const response = await apiClient.post<ApiSuccessResponse<Task>>('/admin/tasks', toPayload(data))
  return response.data.data
}

export async function updateTask(id: string | number, data: TaskFormData): Promise<Task> {
  const response = await apiClient.put<ApiSuccessResponse<Task>>(`/admin/tasks/${id}`, toPayload(data))
  return response.data.data
}

export async function deleteTask(id: string | number): Promise<void> {
  await apiClient.delete<ApiSuccessResponse<Record<string, never>>>(`/admin/tasks/${id}`)
}
