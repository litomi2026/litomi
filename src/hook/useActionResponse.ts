import { useQueryClient } from '@tanstack/react-query'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { QueryKeys } from '@/constants/query'
import amplitude from '@/lib/amplitude/lazy'
import { ActionResponse, ErrorResponse, SuccessResponse } from '@/utils/action-response'

type Props<T extends ActionResponse, TActionArgs extends unknown[]> = {
  action: (...args: TActionArgs) => Promise<T>
  onSuccess?: (data: T extends SuccessResponse<infer D> ? D : never, args: TActionArgs) => void
  onError?: (error: T extends ErrorResponse<infer E> ? E : never, response: T) => void
  onSettled?: (response: T) => void
  shouldSetResponse?: boolean
}

export function getFieldError<T extends ActionResponse>(response: T | undefined, field: string) {
  if (!response) {
    return
  }

  if (!response.ok && typeof response.error === 'object' && response.error !== null && !Array.isArray(response.error)) {
    return response.error[field]
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

export default function useActionResponse<T extends ActionResponse, TActionArgs extends unknown[]>({
  action,
  onSuccess,
  onError,
  shouldSetResponse = true,
}: Readonly<Props<T, TActionArgs>>) {
  const [response, setResponse] = useState<T>()
  const [isPending, startTransition] = useTransition()
  const queryClient = useQueryClient()

  function dispatchAction(...args: TActionArgs) {
    startTransition(async () => {
      const response = await action(...args)

      if (shouldSetResponse) {
        setResponse(response)
      }

      if (!response.ok) {
        if (response.status === 401) {
          queryClient.setQueriesData({ queryKey: QueryKeys.me }, () => null)
          amplitude.reset()
        }

        const error = response.error as T extends ErrorResponse<infer E> ? E : never

        if (onError) {
          // TODO: 첫번째 파라미터를 두번째 파라미터로 바꾸기
          onError(error, response)
        } else if (typeof error === 'string') {
          if (response.status >= 400 && response.status < 500) {
            toast.warning(error)
          } else {
            toast.error(error)
          }
        } else if (Array.isArray(error)) {
          const firstError = error.find((err) => err !== undefined)

          if (firstError && typeof firstError === 'string') {
            if (response.status >= 400 && response.status < 500) {
              toast.warning(firstError)
            } else {
              toast.error(firstError)
            }
          }
        }
      } else {
        onSuccess?.(response.data as T extends SuccessResponse<infer D> ? D : never, args)
      }
    })
  }

  return [response, dispatchAction, isPending] as const
}
