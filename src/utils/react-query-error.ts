import { ApiResponse } from '@/crawler/proxy-utils'

// NOTE: 응답의 error 객체를 처리하는 클래스
export class ResponseError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number,
    public readonly isRetryable: boolean,
  ) {
    super(message)
    this.name = 'ResponseError'
  }
}

export async function handleResponseError<T>(response: Response) {
  if (!response.ok) {
    throw new ResponseError(
      (await response.text()) || '오류가 발생했어요.',
      response.statusText || 'UNKNOWN_ERROR',
      response.status,
      response.status >= 500,
    )
  }

  const data = (await response.json()) as ApiResponse<T>

  if (data.error) {
    throw new ResponseError(
      data.error.message || '오류가 발생했어요.',
      data.error.code || 'UNKNOWN_ERROR',
      response.status,
      data.error.isRetryable,
    )
  }

  return data
}

export function shouldRetryError(error: unknown, failureCount: number, maxRetries = 3): boolean {
  if (failureCount >= maxRetries) {
    return false
  }

  if (!(error instanceof Error)) {
    return false
  }

  if (error instanceof ResponseError) {
    return error.isRetryable
  }

  const message = error.message.toLowerCase()
  return message.includes('fetch') || message.includes('network')
}
