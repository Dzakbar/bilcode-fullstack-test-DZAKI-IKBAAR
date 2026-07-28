import type { ApiSuccessResponse } from './api'

export type UserRole = 'admin' | 'member'

export type MemberProfession = 'developer' | 'designer' | null

export interface AuthenticatedUser {
  id: number
  name: string
  email: string
  role: UserRole
  profession: MemberProfession
}

export interface AdminLoginRequest {
  email: string
  password: string
  device_name: string
}

export interface AuthLoginData {
  token: string
  token_type: 'Bearer'
  user: AuthenticatedUser
}

export interface CurrentUserData {
  user: AuthenticatedUser
}

export type AuthLoginResponse = ApiSuccessResponse<AuthLoginData>

export type CurrentUserResponse = ApiSuccessResponse<CurrentUserData>

export type LogoutResponse = ApiSuccessResponse<Record<string, never>>
