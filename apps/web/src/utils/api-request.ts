import { problemCode } from '@litomi/contracts'
import { CookieKey } from '@litomi/http/cookie'
import { isProblemType } from '@litomi/http/problem-details'
import Cookies from 'js-cookie'

import { fetchResponseData, ProblemDetailsError } from '@/utils/fetch-response'

type SearchParamValue = boolean | number | string | number[] | string[] | null | undefined

let authRefreshPromise: Promise<boolean> | null = null
const AUTH_REFRESH_PATH = '/api/v1/auth/refresh'

export class UserVisibleError extends Error {
  readonly name = 'UserVisibleError'
}

export function buildSearchParams(params: Record<string, SearchParamValue>): URLSearchParams {
  const searchParams = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item != null && item !== '') {
          searchParams.append(key, String(item))
        }
      }
    } else if (value != null && value !== '') {
      searchParams.set(key, String(value))
    }
  }

  return searchParams
}

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
