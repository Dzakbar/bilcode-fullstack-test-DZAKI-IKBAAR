import { apiClient } from './apiClient'
import type { ApiSuccessResponse } from '../types/api'

export type TaskCategory = 'frontend' | 'backend' | 'design' | 'qa'

export interface GeneratedTask {
  title: string
  description: string
  category: TaskCategory
  estimated_effort: number
  status: 'todo'
}

export async function breakdownPRD(prdText: string): Promise<GeneratedTask[]> {
  const response = await apiClient.post<ApiSuccessResponse<GeneratedTask[]>>('/admin/ai/breakdown', {
    prd_text: prdText,
  })
  return response.data.data
}

export async function saveGeneratedTasks(
  projectId: number,
  tasks: GeneratedTask[],
): Promise<number> {
  const response = await apiClient.post<ApiSuccessResponse<number>>('/admin/ai/save-tasks', {
    project_id: projectId,
    tasks,
  })
  return response.data.data
}
