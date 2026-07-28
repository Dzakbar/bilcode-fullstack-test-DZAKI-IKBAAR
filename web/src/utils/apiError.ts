import axios from 'axios'
import type { ApiErrorResponse } from '../types/api'

interface ApiErrorDetails {
  message: string
  fieldErrors?: Record<string, string[]>
  status?: number
}

function friendlyStatusMessage(status?: number): string {
  if (!status) {
    return 'Unable to connect to the server. Please confirm that the backend is running.'
  }

  if (status === 401) {
    return 'Invalid credentials or your session has expired. Please sign in again.'
  }

  if (status === 403) {
    return 'Not allowed.'
  }

  if (status === 404) {
    return 'The requested record could not be found.'
  }

  if (status === 422) {
    return 'Please check the highlighted fields and try again.'
  }

  if (status === 409) {
    return 'This action cannot be completed until related records are updated.'
  }

  if (status >= 500) {
    return 'The server could not complete the request. Please try again shortly.'
  }

  return 'Something went wrong. Please try again.'
}

export function getApiErrorDetails(error: unknown): ApiErrorDetails {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const status = error.response?.status

    return {
      message: friendlyStatusMessage(status),
      fieldErrors: error.response?.data.errors,
      status,
    }
  }

  if (error instanceof Error && error.message.includes('Malformed')) {
    return { message: error.message }
  }

  return { message: 'Something went wrong. Please try again.' }
}

export function getApiErrorMessage(error: unknown): string {
  return getApiErrorDetails(error).message
}
