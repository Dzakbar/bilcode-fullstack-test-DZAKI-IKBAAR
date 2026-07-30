import { apiClient } from './apiClient'

export interface DashboardSummary {
  stats: {
    total_clients: number
    total_projects: number
    total_tasks: number
    total_members: number
    tasks_overdue: number
    tasks_by_status: {
      todo: number
      in_progress: number
      review: number
      done: number
    }
    projects_by_status: {
      planning: number
      active: number
      completed: number
      cancelled: number
    }
  }
  recent_time_logs: Array<{
    id: number
    member_name: string
    task_title: string
    project_name: string
    duration_minutes: number
    note: string | null
    work_date: string
  }>
  member_workload: Array<{
    id: number
    name: string
    profession: string | null
    assigned_tasks: number
    total_logged_hours: number
  }>
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const response = await apiClient.get('/admin/dashboard/summary')
  return response.data.data
}
