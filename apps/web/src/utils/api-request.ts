import { CookieKey } from '@litomi/http/cookie'
import { isProblemType, problemCode } from '@litomi/http/problem-details'
import Cookies from 'js-cookie'

import { fetchResponseData, ProblemDetailsError } from '@/utils/fetch-response'

const AUTH_REFRESH_PATH = '/api/v1/auth/refresh'

export class UserVisibleError extends Error {
  readonly name = 'UserVisibleError'
}

let authRefreshPromise: Promise<boolean> | null = null

export async function fetchAPIData<T>(
  input: string | Request | URL,
  init?: RequestInit,
): Promise<{ data: T; response: Response }> {
  const request = new Request(input, init)

  try {
    return await fetchResponseData<T>(request.clone())
  } catch (error) {
    if (isAuthenticationRequiredError(error) && shouldRefreshAuthCookies(request) && (await refreshAuthCookies())) {
      return await fetchResponseData<T>(request.clone())
    }

    throw error
  }
}

export function isAuthenticationRequiredError(error: unknown): boolean {
  return (
    error instanceof ProblemDetailsError &&
    error.status === 401 &&
    isProblemType(error.type, problemCode.AUTHENTICATION_REQUIRED)
  )
}

export function withQuery(path: string, searchParams?: URLSearchParams): string {
  const query = searchParams?.toString()
  return query ? `${path}?${query}` : path
}

function isAuthRefreshRequest(request: Request): boolean {
  const requestURL = new URL(request.url)

  return requestURL.origin === window.location.origin && requestURL.pathname === AUTH_REFRESH_PATH
}

async function refreshAuthCookies(): Promise<boolean> {
  if (!authRefreshPromise) {
    authRefreshPromise = fetch(AUTH_REFRESH_PATH, {
      method: 'POST',
      cache: 'no-store',
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        authRefreshPromise = null
      })
  }

  return authRefreshPromise
}

function shouldRefreshAuthCookies(request: Request): boolean {
  if (typeof window === 'undefined' || isAuthRefreshRequest(request)) {
    return false
  }

  if (Cookies.get(CookieKey.AUTH_HINT) !== '1') {
    return false
  }

  if (request.credentials === 'same-origin') {
    return new URL(request.url).origin === window.location.origin
  }

  return false
}
