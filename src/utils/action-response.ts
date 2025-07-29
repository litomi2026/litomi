/**
 * Simple Action Response System
 *
 * HTTP-like response format for Next.js server actions
 */
export type ActionResponse<T = unknown> =
  | {
      data?: T
      error?: Record<string, string>
      ok: boolean
      status: 400
      statusText: string
    }
  | {
      data?: T
      error?: string
      ok: boolean
      status: number
      statusText: string
    }

export function badRequest<T = unknown>(error: Record<string, string>): ActionResponse<T> {
  return {
    ok: false,
    status: 400,
    statusText: 'Bad Request',
    error,
  }
}

export function conflict<T = unknown>(error: string): ActionResponse<T> {
  return {
    ok: false,
    status: 409,
    statusText: 'Conflict',
    error,
  }
}

export function created<T>(data: T): ActionResponse<T> {
  return {
    ok: true,
    status: 201,
    statusText: 'Created',
    data,
  }
}

export function forbidden<T = unknown>(error = 'Forbidden'): ActionResponse<T> {
  return {
    ok: false,
    status: 403,
    statusText: 'Forbidden',
    error,
  }
}

export function notFound<T = unknown>(error = 'Not Found'): ActionResponse<T> {
  return {
    ok: false,
    status: 404,
    statusText: 'Not Found',
    error,
  }
}

export function ok<T>(data: T): ActionResponse<T> {
  return {
    ok: true,
    status: 200,
    statusText: 'OK',
    data,
  }
}

export function serverError<T = unknown>(error = 'Internal Server Error'): ActionResponse<T> {
  return {
    ok: false,
    status: 500,
    statusText: 'Internal Server Error',
    error,
  }
}

export function tooManyRequests<T = unknown>(error = 'Too Many Requests'): ActionResponse<T> {
  return {
    ok: false,
    status: 429,
    statusText: 'Too Many Requests',
    error,
  }
}

export function unauthorized<T = unknown>(error = 'Unauthorized'): ActionResponse<T> {
  return {
    ok: false,
    status: 401,
    statusText: 'Unauthorized',
    error,
  }
}
