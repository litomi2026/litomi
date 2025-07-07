import { ApiResponse } from '@/crawler/proxy-utils'

// NOTE: 응답의 error 객체를 처리하는 클래스
export class ResponseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message)
    this.name = 'ResponseError'
  }
}

export async function handleResponseError<T>(response: Response) {
  const data = (await response.json()) as ApiResponse<T>

  if (data.error) {
    throw new ResponseError(
      data.error.message || '오류가 발생했어요.',
      data.error.code || 'UNKNOWN_ERROR',
      response.status,
      data.error.details,
    )
  }

  return data
}

export function shouldRetryError(error: unknown, failureCount: number, maxRetries = 3): boolean {
  // Don't retry if we've exceeded max retries
  if (failureCount >= maxRetries) return false

  // Never retry validation errors (4xx)
  if (error instanceof ResponseError && error.status >= 400 && error.status < 500) return false

  // Never retry non-error objects
  if (!(error instanceof Error)) return false

  // Retry network errors and 5xx errors
  const isNetworkError = error.message.includes('fetch') || error.message.includes('network')
  const isServerError = error instanceof ResponseError && error.status >= 500

  return isNetworkError || isServerError
}
