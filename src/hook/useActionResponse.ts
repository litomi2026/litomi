import { useActionState, useEffect, useRef } from 'react'

import type { ActionResponse, ErrorResponse, SuccessResponse } from '@/utils/action-response'

type ServerAction<TData, TError> = (
  prevState: unknown,
  formData: FormData,
) => Promise<
  | ErrorResponse<TError extends string | Record<string, string> ? Record<string, string> : never>
  | ErrorResponse<TError extends string | Record<string, string> ? string : TError>
  | SuccessResponse<TData>
>

type UseActionResponseOptions<TData, TError> = {
  onSuccess?: (data: TData) => Promise<void> | void
  onError?: (error: TError) => Promise<void> | void
}

export function getFieldError<TData, TError extends string | Record<string, string>>(
  response: ActionResponse<TData, TError>,
  field: string,
): string | undefined {
  if (!response.ok && typeof response.error === 'object' && response.error !== null) {
    return (response.error as Record<string, string>)[field]
  }
  return undefined
}

export function getFormField<TData, TError extends string | Record<string, string>>(
  response: ActionResponse<TData, TError>,
  field: string,
) {
  if (!response.ok) {
    return response.formData?.get(field)?.toString()
  }
}

export function useActionResponse<TData = unknown, TError = string | Record<string, string>>(
  action: ServerAction<TData, TError>,
  options?: UseActionResponseOptions<TData, TError>,
) {
  const [response, dispatch, pending] = useActionState(
    action as (prevState: unknown, formData: FormData) => Promise<ActionResponse<TData, TError>>,
    {} as ActionResponse<TData, TError>,
  )
  const lastResponseRef = useRef(response)
  const { onSuccess, onError } = options || {}

  useEffect(() => {
    // Only process if not pending, response changed, and has a valid ok property
    if (!pending && response !== lastResponseRef.current && typeof response === 'object' && 'ok' in response) {
      lastResponseRef.current = response

      if (response.ok && onSuccess) {
        onSuccess(response.data as TData)
      } else if (!response.ok && onError) {
        onError(response.error)
      }
    }
  }, [response, pending, onSuccess, onError])

  return [response, dispatch, pending] as const
}
