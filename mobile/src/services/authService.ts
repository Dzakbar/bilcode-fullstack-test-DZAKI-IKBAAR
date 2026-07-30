import { apiClient } from './apiClient'

export interface AuthenticatedUser {
  id: number
  name: string
  email: string
  role: string
  profession?: string
}

export async function loginMember(email: string, password: string): Promise<{ token: string; user: AuthenticatedUser }> {
  const response = await apiClient.post('/auth/member/login', {
    email,
    password,
    device_name: 'mobile-app',
  })
  return { token: response.data.data.token, user: response.data.data.user }
}

export async function getCurrentUser(): Promise<{ user: AuthenticatedUser }> {
  const response = await apiClient.get('/auth/me')
  return response.data.data
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/auth/logout')
}
