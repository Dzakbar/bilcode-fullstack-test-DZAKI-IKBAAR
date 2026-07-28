import { apiClient } from './apiClient'
import type {
  AdminLoginRequest,
  AuthLoginData,
  AuthLoginResponse,
  CurrentUserData,
  CurrentUserResponse,
  LogoutResponse,
} from '../types/auth'

function assertAuthLoginData(data: AuthLoginData): AuthLoginData {
  if (!data.token || data.token_type !== 'Bearer' || !data.user) {
    throw new Error('Malformed login response received from the server.')
  }

  return data
}

function assertCurrentUserData(data: CurrentUserData): CurrentUserData {
  if (!data.user) {
    throw new Error('Malformed current-user response received from the server.')
  }

  return data
}

export function getBrowserDeviceName(): string {
  return 'web-browser'
}

export async function loginAdmin(credentials: Omit<AdminLoginRequest, 'device_name'>): Promise<AuthLoginData> {
  const response = await apiClient.post<AuthLoginResponse>('/auth/admin/login', {
    ...credentials,
    device_name: getBrowserDeviceName(),
  })

  return assertAuthLoginData(response.data.data)
}

export async function getCurrentUser(): Promise<CurrentUserData> {
  const response = await apiClient.get<CurrentUserResponse>('/auth/me')

  return assertCurrentUserData(response.data.data)
}

export async function logout(): Promise<void> {
  await apiClient.post<LogoutResponse>('/auth/logout')
}
