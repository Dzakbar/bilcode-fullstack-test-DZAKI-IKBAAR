import { apiClient } from './apiClient'
import type { ApiPaginatedResponse } from '../types/api'
import type { Member } from '../types/member'

export async function getMembers(): Promise<ApiPaginatedResponse<Member>> {
  const response = await apiClient.get<ApiPaginatedResponse<Member>>('/admin/members', {
    params: {
      per_page: 100,
    },
  })

  return response.data
}

