export type ActionResponse<TData = unknown, TError = string | Record<string, string> | unknown[]> =
  | ErrorResponse<TError>
  | SuccessResponse<TData>

export type ErrorResponse<TError> = {
  ok: false
  status: 400 | 401 | 403 | 404 | 409 | 429 | 500
  error: TError
  formData?: FormData
}

export type SuccessResponse<TData = unknown> = {
  ok: true
  status: 200 | 201 | 204 | 303
  data: TData
}

export function badRequest<TError>(error: TError, formData?: FormData): ErrorResponse<TError> {
  return {
    ok: false as const,
    status: 400,
    error,
    formData,
  }
}

export function conflict<TError>(error: TError, formData?: FormData): ErrorResponse<TError> {
  return {
    ok: false as const,
    status: 409,
    error,
    formData,
  }
}

export function created<TData>(data: TData): SuccessResponse<TData> {
  return {
    ok: true as const,
    status: 201,
    data,
  }
}

export function forbidden<TError>(error: TError, formData?: FormData): ErrorResponse<TError> {
  return {
    ok: false as const,
    status: 403,
    error,
    formData,
  }
}

export function internalServerError<TError>(error: TError, formData?: FormData): ErrorResponse<TError> {
  return {
    ok: false as const,
    status: 500,
    error,
    formData,
  }
}

export function noContent(): SuccessResponse<undefined> {
  return {
    ok: true as const,
    status: 204,
    data: undefined,
  }
}

export function notFound<TError>(error: TError, formData?: FormData): ErrorResponse<TError> {
  return {
    ok: false as const,
    status: 404,
    error,
    formData,
  }
}

export function ok<TData>(data: TData): SuccessResponse<TData> {
  return {
    ok: true as const,
    status: 200,
    data,
  }
}

export function seeOther(location: string, message: string): SuccessResponse<{ location: string; message: string }> {
  return {
    ok: true as const,
    status: 303,
    data: {
      location,
      message,
    },
  }
}

export function tooManyRequests(error = 'Too Many Requests', formData?: FormData): ErrorResponse<string> {
  return {
    ok: false as const,
    status: 429,
    error,
    formData,
  }
}

export function unauthorized(error = 'Unauthorized', formData?: FormData): ErrorResponse<string> {
  return {
    ok: false as const,
    status: 401,
    error,
    formData,
  }
}
