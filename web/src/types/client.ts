import type { ApiErrorResponse } from './api'

export interface Client {
  id: number
  name: string
  email: string
  company: string | null
  projects_count?: number
  created_at: string
  updated_at: string
}

export interface ClientFormData {
  name: string
  email: string
  company: string
}

export type ValidationErrorResponse = ApiErrorResponse

