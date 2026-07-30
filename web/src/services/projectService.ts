import { apiClient } from './apiClient'
import type { ApiPaginatedResponse, ApiSuccessResponse } from '../types/api'
import type { Project, ProjectFormData, ProjectStatus } from '../types/project'

type ProjectPayload = {
  client_id: number
  name: string
  status: ProjectStatus
  brief?: string | null
  deadline?: string | null
}

function toPayload(data: ProjectFormData): ProjectPayload {
  return {
    client_id: Number(data.client_id),
    name: data.name.trim(),
    status: data.status,
    brief: data.description ? data.description.trim() : null,
    deadline: data.due_date || null,
  }
}

export async function getProjects(): Promise<ApiPaginatedResponse<Project>> {
  const response = await apiClient.get<ApiPaginatedResponse<Project>>('/admin/projects')

  return response.data
}

export async function getProject(id: string | number): Promise<Project> {
  const response = await apiClient.get<ApiSuccessResponse<Project>>(`/admin/projects/${id}`)

  return response.data.data
}

export async function createProject(data: ProjectFormData): Promise<Project> {
  const response = await apiClient.post<ApiSuccessResponse<Project>>('/admin/projects', toPayload(data))

  return response.data.data
}

export async function updateProject(id: string | number, data: ProjectFormData): Promise<Project> {
  const response = await apiClient.put<ApiSuccessResponse<Project>>(`/admin/projects/${id}`, toPayload(data))

  return response.data.data
}

export async function deleteProject(id: string | number): Promise<void> {
  await apiClient.delete<ApiSuccessResponse<Record<string, never>>>(`/admin/projects/${id}`)
}
