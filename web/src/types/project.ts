import type { Client } from './client'
import type { Member } from './member'

export type ProjectStatus = 'active' | 'completed' | 'planning' | 'cancelled'

export interface ProjectClient {
  id: number
  name: string
  company?: string | null
}

export interface Project {
  id: number
  name: string
  status: ProjectStatus
  client: ProjectClient
  brief?: string | null
  deadline?: string | null
  tasks_count?: number
  created_at: string
  updated_at: string
}

export interface ProjectFormData {
  name: string
  client_id: string
  status: ProjectStatus
  description?: string
  due_date?: string
  member_ids?: string[]
  start_date?: string
}

export interface ProjectSupportData {
  clients: Client[]
  members: Member[]
}
