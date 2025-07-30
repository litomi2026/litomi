/**
 * Simple Action Response System
 *
 * HTTP-like response format for Next.js server actions
 */
export type ActionResponse<T = unknown> =
  | {
      data?: T
      ok: true
      status: number
    }
  | {
      error?: string
      ok: false
      status: number
      formData?: FormData
    }
  | {
      ok: false
      status: 400
      error: Record<string, string>
      formData?: FormData
    }

export function badRequest<T = unknown>(error: Record<string, string>, formData?: FormData): ActionResponse<T> {
  return {
    ok: false,
    status: 400,
    error,
    formData,
  }
}

export function conflict<T = unknown>(message: string, formData?: FormData): ActionResponse<T> {
  return {
    ok: false,
    status: 409,
    error: message,
    formData,
  }
}

export function created<T>(data: T): ActionResponse<T> {
  return {
    ok: true,
    status: 201,
    data,
  }
}

export function forbidden<T = unknown>(error = 'Forbidden', formData?: FormData): ActionResponse<T> {
  return {
    ok: false,
    status: 403,
    error,
    formData,
  }
}

export function noContent<T = unknown>(): ActionResponse<T> {
  return {
    ok: true,
    status: 204,
  }
}

export function notFound<T = unknown>(error = 'Not Found', formData?: FormData): ActionResponse<T> {
  return {
    ok: false,
    status: 404,
    error,
    formData,
  }
}

export function ok<T>(data: T): ActionResponse<T> {
  return {
    ok: true,
    status: 200,
    data,
  }
}

export function serverError<T = unknown>(error = 'Internal Server Error', formData?: FormData): ActionResponse<T> {
  return {
    ok: false,
    status: 500,
    error,
    formData,
  }
}

export function tooManyRequests<T = unknown>(error = 'Too Many Requests', formData?: FormData): ActionResponse<T> {
  return {
    ok: false,
    status: 429,
    error,
    formData,
  }
}

export function unauthorized<T = unknown>(error = 'Unauthorized', formData?: FormData): ActionResponse<T> {
  return {
    ok: false,
    status: 401,
    error,
    formData,
  }
}
