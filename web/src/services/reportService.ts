import { apiClient } from './apiClient'
import type { ApiSuccessResponse } from '../types/api'

export interface ReportRow {
  id: number
  work_date: string
  member_id: number
  member_name: string
  member_profession: string | null
  project_id: number
  project_name: string
  task_id: number
  task_title: string
  duration_minutes: number
  duration_hours: number
  note: string | null
}

export interface ReportSummary {
  total_logs: number
  total_minutes: number
  total_hours: number
}

export interface WorkHoursReport {
  rows: ReportRow[]
  summary: ReportSummary
  filters: {
    project_id?: string
    member_id?: string
    date_from?: string
    date_to?: string
  }
}

export interface ReportProject {
  id: number
  name: string
  status: string
  client_name: string
  tasks_count: number
  total_estimated_hours: number
}

export interface MemberOption {
  id: number
  name: string
  profession: string | null
}

export async function getWorkHours(params?: Record<string, string>): Promise<WorkHoursReport> {
  const response = await apiClient.get<ApiSuccessResponse<WorkHoursReport>>('/admin/reports/work-hours', { params })
  return response.data.data
}

export async function getReportProjects(): Promise<ReportProject[]> {
  const response = await apiClient.get<ApiSuccessResponse<ReportProject[]>>('/admin/reports/projects')
  return response.data.data
}

export async function exportCsv(params?: Record<string, string>): Promise<void> {
  const search = new URLSearchParams()
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value)
    }
  }
  const qs = search.toString()
  const url = `/admin/reports/work-hours/export${qs ? `?${qs}` : ''}`

  const response = await apiClient.get(url, { responseType: 'blob' })
  const blob = new Blob([response.data], { type: 'text/csv' })
  const blobUrl = window.URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = blobUrl
  a.download = `work-hours-report-${new Date().toISOString().slice(0, 10)}.csv`
  document.body.append(a)
  a.click()
  a.remove()
  window.URL.revokeObjectURL(blobUrl)
}

export async function getMembers(): Promise<MemberOption[]> {
  const response = await apiClient.get('/admin/members', { params: { per_page: 100 } })
  return response.data.data
}
