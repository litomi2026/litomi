import { useActionState, useEffect, useRef } from 'react'

import type { ActionResponse } from '@/utils/action-response'

type ServerAction<TResponse> = (prevState: unknown, formData: FormData) => Promise<TResponse>

type UseActionResponseOptions<TData, TError> = {
  onSuccess?: (data: TData) => Promise<void> | void
  onError?: (error: TError) => Promise<void> | void
}

export function useActionResponse<TData = unknown, TError = string | Record<string, string>>(
  action: ServerAction<ActionResponse<TData, TError>>,
  initialState: Partial<ActionResponse<TData, TError>> = {},
  options?: UseActionResponseOptions<TData, TError>,
) {
  const [response, dispatch, pending] = useActionState(action, initialState as ActionResponse<TData, TError>)
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
