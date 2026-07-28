const ADMIN_TOKEN_KEY = 'projectpulse_admin_token'

export function getStoredAdminToken(): string | null {
  return window.localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function storeAdminToken(token: string): void {
  window.localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function clearStoredAdminToken(): void {
  window.localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export { ADMIN_TOKEN_KEY }
