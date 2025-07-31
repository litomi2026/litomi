import { useQueryClient } from '@tanstack/react-query'
import { useState, useTransition } from 'react'

import { QueryKeys } from '@/constants/query'
import amplitude from '@/lib/amplitude/lazy'
import { ActionResponse, ErrorResponse, SuccessResponse } from '@/utils/action-response'

type Props<T extends ActionResponse> = {
  action: (prevState: unknown, formData: FormData) => Promise<T>
  onSuccess?: (data: T extends SuccessResponse<infer D> ? D : never) => void
  onError?: (error: T extends ErrorResponse<infer E> ? E : never) => void
  onSettled?: (response: T) => void
  shouldSetResponse?: boolean
}

export function getFieldError<T extends ActionResponse>(response: T | undefined, field: string) {
  if (!response) {
    return
  }

  if (!response.ok && typeof response.error === 'object' && response.error !== null) {
    return (response.error as Record<string, string>)[field]
  }
}

export function getFormField<T extends ActionResponse>(response: T | undefined, field: string) {
  if (!response) {
    return
  }

  if (!response.ok) {
    return response.formData?.get(field)?.toString()
  }
}

export default function useActionResponse<T extends ActionResponse>({
  action,
  onSuccess,
  onError,
  shouldSetResponse = true,
}: Readonly<Props<T>>) {
  const [response, setResponse] = useState<T>()
  const [isPending, startTransition] = useTransition()
  const queryClient = useQueryClient()

  function dispatchAction(formData: FormData) {
    startTransition(async () => {
      const response = await action({}, formData)

      if (shouldSetResponse) {
        setResponse(response)
      }

      if (!response.ok) {
        if (response.status === 401) {
          queryClient.setQueriesData({ queryKey: QueryKeys.me }, () => null)
          amplitude.reset()
        }

        onError?.(response.error as T extends ErrorResponse<infer E> ? E : never)
      } else {
        onSuccess?.(response.data as T extends SuccessResponse<infer D> ? D : never)
      }
    })
  }

  return [response, dispatchAction, isPending] as const
}
