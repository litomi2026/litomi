import { useActionState, useEffect, useRef } from 'react'

import { ActionResponse } from '@/utils/action-response'

interface UseActionResponseOptions<T> {
  onError?: (error: string | Record<string, string>) => void
  onSuccess?: (data: T) => Promise<void> | void
}

export function useActionResponse<T>(
  action: (prevState: unknown, formData: FormData) => Promise<ActionResponse<T>>,
  initialState: ActionResponse<T>,
  options?: UseActionResponseOptions<T>,
) {
  const [response, dispatch, pending] = useActionState(action, initialState)
  const lastResponseRef = useRef<ActionResponse<T>>(response)
  const { onSuccess, onError } = options || {}

  useEffect(() => {
    if (!pending && response !== lastResponseRef.current && response.status !== 0) {
      lastResponseRef.current = response

      if (response.ok && response.data && onSuccess) {
        onSuccess(response.data)
      } else if (!response.ok && response.error && onError) {
        onError(response.error)
      }
    }
  }, [response, pending, onSuccess, onError])

  return [response, dispatch, pending] as const
}
