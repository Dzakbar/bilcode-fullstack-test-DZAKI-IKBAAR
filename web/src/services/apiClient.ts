import axios from 'axios'
import { clearStoredAdminToken, getStoredAdminToken } from './tokenStorage'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:8000/api'

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 10_000,
})

apiClient.interceptors.request.use((config) => {
  const token = getStoredAdminToken()

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      const requestUrl = error.config?.url ?? ''
      const isLoginRequest = requestUrl.includes('/auth/admin/login')

      if (!isLoginRequest) {
        clearStoredAdminToken()
      }
    }

    return Promise.reject(error)
  },
)
