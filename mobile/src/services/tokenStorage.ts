const MEMBER_TOKEN_KEY = 'projectpulse_member_token'

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(MEMBER_TOKEN_KEY)
  } catch {
    return null
  }
}

export function storeToken(token: string): void {
  try {
    localStorage.setItem(MEMBER_TOKEN_KEY, token)
  } catch {
    // silent
  }
}

export function clearStoredToken(): void {
  try {
    localStorage.removeItem(MEMBER_TOKEN_KEY)
  } catch {
    // silent
  }
}
