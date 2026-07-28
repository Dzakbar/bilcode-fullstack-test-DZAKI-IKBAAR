import { apiClient } from './apiClient'
import type { ApiPaginatedResponse, ApiSuccessResponse } from '../types/api'
import type { Client, ClientFormData } from '../types/client'

type ClientPayload = {
  name: string
  email: string
  company: string | null
}

function toPayload(data: ClientFormData): ClientPayload {
  return {
    name: data.name.trim(),
    email: data.email.trim(),
    company: data.company.trim() || null,
  }
}

export async function getClients(): Promise<ApiPaginatedResponse<Client>> {
  const response = await apiClient.get<ApiPaginatedResponse<Client>>('/clients')

  return response.data
}

export async function getClient(id: string | number): Promise<Client> {
  const response = await apiClient.get<ApiSuccessResponse<Client>>(`/clients/${id}`)

  return response.data.data
}

export async function createClient(data: ClientFormData): Promise<Client> {
  const response = await apiClient.post<ApiSuccessResponse<Client>>('/clients', toPayload(data))

  return response.data.data
}

export async function updateClient(id: string | number, data: ClientFormData): Promise<Client> {
  const response = await apiClient.put<ApiSuccessResponse<Client>>(`/clients/${id}`, toPayload(data))

  return response.data.data
}

export async function deleteClient(id: string | number): Promise<void> {
  await apiClient.delete<ApiSuccessResponse<Record<string, never>>>(`/clients/${id}`)
}
