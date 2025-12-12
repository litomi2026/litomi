export abstract class ProxyError extends Error {
  abstract readonly errorCode: string
  abstract readonly isRetryable: boolean
  abstract readonly statusCode: number

  constructor(
    message?: string,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message)
    this.name = this.constructor.name
    Error.captureStackTrace(this, this.constructor)
  }

  toJSON() {
    return {
      error: this.errorCode,
      message: this.message,
      statusCode: this.statusCode,
      context: this.context,
    }
  }
}

export class AllSourcesFailedError extends ProxyError {
  readonly errorCode = 'ALL_SOURCES_FAILED'
  readonly isRetryable = false
  readonly statusCode = 404

  constructor(context?: Record<string, unknown>) {
    super('모든 소스에서 찾을 수 없어요', context)
  }
}

export class CircuitBreakerError extends ProxyError {
  readonly errorCode = 'CIRCUIT_BREAKER_OPEN'
  readonly isRetryable = false
  readonly statusCode = 503

  constructor(message = '현재 외부 API 서비스에 접속할 수 없어요', context?: Record<string, unknown>) {
    super(message, context)
  }
}

export class InternalError extends ProxyError {
  readonly errorCode = 'INTERNAL_ERROR'
  readonly isRetryable = false
  readonly statusCode = 500

  constructor(message = '알 수 없는 오류가 발생했어요', context?: Record<string, unknown>) {
    super(message, context)
  }
}

export class NetworkError extends ProxyError {
  readonly errorCode = 'NETWORK_ERROR'
  readonly isRetryable = true
  readonly statusCode = 503

  constructor(message = '네트워크 연결을 확인해 주세요', context?: Record<string, unknown>) {
    super(message, context)
  }
}

export class NotFoundError extends ProxyError {
  readonly errorCode = 'NOT_FOUND'
  readonly isRetryable = false
  readonly statusCode = 404

  constructor(message = '요청하신 정보를 찾을 수 없어요', context?: Record<string, unknown>) {
    super(message, context)
  }
}

export class ParseError extends ProxyError {
  readonly errorCode = 'PARSE_ERROR'
  readonly isRetryable = false
  readonly statusCode = 502

  constructor(message = '작업을 처리하는 중 문제가 발생했어요', context?: Record<string, unknown>) {
    super(message, context)
  }
}

export class TimeoutError extends ProxyError {
  readonly errorCode = 'REQUEST_TIMEOUT'
  readonly isRetryable = true
  readonly statusCode = 408

  constructor(message = '요청 시간이 초과됐어요', context?: Record<string, unknown>) {
    super(message, context)
  }
}

export class UpstreamServerError extends ProxyError {
  readonly errorCode = 'UPSTREAM_ERROR'
  readonly isRetryable: boolean
  readonly retryAfter: string | null
  readonly statusCode: number

  constructor(
    message = '작업을 처리하는 중 문제가 발생했어요',
    upstreamStatus: number,
    context?: Record<string, unknown>,
  ) {
    super(message, context)
    this.retryAfter = context?.retryAfter as string | null
    this.statusCode = upstreamStatus >= 500 ? 502 : upstreamStatus
    this.isRetryable = [429, 500, 502, 503, 504, 507, 509, 520, 598, 599].includes(upstreamStatus)
  }
}

export function isRetryableError(error: unknown): boolean {
  if (error instanceof ProxyError) {
    return error.isRetryable
  }

  if (error instanceof Error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      return false
    }

    const message = error.message.toLowerCase()

    return (
      message.includes('network') ||
      message.includes('fetch') ||
      message.includes('timeout') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('socket hang up')
    )
  }

  return false
}

export function normalizeError(error: unknown, defaultMessage = '알 수 없는 오류가 발생했어요.'): ProxyError {
  if (error instanceof ProxyError) {
    return error
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase()

    if (error.name === 'AbortError' || message.includes('timeout')) {
      return new TimeoutError(error.message)
    }

    if (
      message.includes('fetch') ||
      message.includes('network') ||
      message.includes('econnreset') ||
      message.includes('econnrefused') ||
      message.includes('socket hang up')
    ) {
      return new NetworkError(error.message)
    }

    return new InternalError(error.message || defaultMessage)
  }

  return new InternalError(defaultMessage)
}
