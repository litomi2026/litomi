import { CookieKey } from '@/constants/storage'

export function clearAuthHintCookie() {
  document.cookie = `${CookieKey.AUTH_HINT}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

export function clearDocumentCookies() {
  for (const entry of document.cookie.split(';')) {
    const [rawKey] = entry.split('=')
    const key = rawKey?.trim()

    if (!key) {
      continue
    }

    document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
  }
}

export function setAuthHintCookie(value = '1') {
  document.cookie = `${CookieKey.AUTH_HINT}=${value}; path=/`
}
