import { env } from '@litomi/env/client'
import {
  isProblemDetails,
  isProblemDetailsContentType,
  isProblemType,
  problemCode,
  type ProblemDetails,
} from '@litomi/http/problem-details'

const { NEXT_PUBLIC_API_ORIGIN } = env

export class HTTPResponseError extends Error {
  readonly name = 'HTTPResponseError'

  get isRetryable(): boolean {
    return this.status === 408 || this.status === 429 || this.status >= 500
  }

  get retryAfterSeconds(): number | undefined {
    return getRetryAfterSeconds(this.response)
  }

  get status(): number {
    return this.response.status
  }

  constructor(public readonly response: Response) {
    super(response.statusText ? `HTTP ${response.status} ${response.statusText}` : `HTTP ${response.status}`)
  }
}

export class ProblemDetailsError extends Error {
  readonly name = 'ProblemDetailsError'

  get isRetryable(): boolean {
    return this.status === 408 || this.status === 429 || this.status >= 500
  }

  get retryAfterSeconds(): number | undefined {
    return getRetryAfterSeconds(this.response)
  }

  get status(): number {
    return this.problem.status
  }

  get type(): string {
    return this.problem.type
  }

  constructor(
    public readonly problem: ProblemDetails,
    public readonly response?: Response,
  ) {
    super(problem.detail ?? problem.title)
  }
}

export class UserVisibleError extends Error {
  readonly name = 'UserVisibleError'
}

let authRefreshPromise: Promise<boolean> | null = null

export async function fetchWithErrorHandling<T>(
  input: string | Request | URL,
  init?: RequestInit,
): Promise<{ data: T; response: Response }> {
  const request = new Request(input, init)
  const response = await fetch(request.clone())

  if (!response.ok) {
    const error = await createResponseError(response)

    if (isAuthenticationRequiredError(error) && shouldRefreshAuthCookies(request) && (await refreshAuthCookies())) {
      const retryResponse = await fetch(request.clone())

      if (!retryResponse.ok) {
        throw await createResponseError(retryResponse)
      }

      return {
        data: await readResponseData<T>(retryResponse),
        response: retryResponse,
      }
    }

    throw error
  }

  return {
    data: await readResponseData<T>(response),
    response,
  }
}

export function isAuthenticationRequiredError(error: unknown): boolean {
  return (
    error instanceof ProblemDetailsError &&
    error.status === 401 &&
    isProblemType(error.type, problemCode.AUTHENTICATION_REQUIRED)
  )
}

async function createResponseError(response: Response): Promise<HTTPResponseError | ProblemDetailsError> {
  const problem = await readProblemDetails(response)

  if (problem) {
    return new ProblemDetailsError(problem, response)
  }

  return new HTTPResponseError(response)
}

function getRetryAfterSeconds(response?: Response): number | undefined {
  const value = response?.headers?.get('Retry-After')
  if (!value) {
    return undefined
  }

  const seconds = Number(value)
  if (Number.isFinite(seconds) && seconds > 0) {
    return seconds
  }

  const timeMs = Date.parse(value)
  if (!Number.isFinite(timeMs)) {
    return undefined
  }

  const diffSeconds = Math.ceil((timeMs - Date.now()) / 1000)
  return diffSeconds > 0 ? diffSeconds : undefined
}

function isAuthRefreshRequest(request: Request): boolean {
  const requestURL = new URL(request.url)
  const refreshURL = new URL('/api/v1/auth/refresh', NEXT_PUBLIC_API_ORIGIN)

  return requestURL.origin === refreshURL.origin && requestURL.pathname === refreshURL.pathname
}

async function readProblemDetails(response: Response): Promise<ProblemDetails | null> {
  if (!isProblemDetailsContentType(response.headers.get('Content-Type'))) {
    return null
  }

  const body: unknown = await response.json().catch(() => null)
  return isProblemDetails(body) ? body : null
}

async function readResponseData<T>(response: Response): Promise<T> {
  if (response.status === 204 || response.headers.get('Content-Length') === '0') {
    return undefined as T
  }

  const contentType = response.headers.get('Content-Type')?.toLowerCase() ?? ''

  if (contentType.includes('json')) {
    return (await response.json()) as T
  }

  const text = await response.text()
  return (text || undefined) as T
}

async function refreshAuthCookies(): Promise<boolean> {
  if (!authRefreshPromise) {
    authRefreshPromise = fetch(new URL('/api/v1/auth/refresh', NEXT_PUBLIC_API_ORIGIN), {
      method: 'POST',
      credentials: 'include',
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

  if (request.credentials === 'include') {
    return true
  }

  if (request.credentials === 'same-origin') {
    return new URL(request.url).origin === window.location.origin
  }

  return false
}
