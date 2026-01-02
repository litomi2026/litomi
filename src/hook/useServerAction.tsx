import { useQueryClient } from '@tanstack/react-query'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import { QueryKeys } from '@/constants/query'
import amplitude from '@/lib/amplitude/browser'
import { showLoginRequiredToast } from '@/lib/toast'
import { ActionResponse, ErrorResponse, SuccessResponse } from '@/utils/action-response'

/**
 * Props for useActionResponse hook
 *
 * @example
 * // User-initiated action with default error handling
 * useActionResponse({
 *   action: saveUserData,
 *   onSuccess: (data) => toast.success('Saved!')
 * })
 *
 * @example
 * // Background task with silent network errors
 * useActionResponse({
 *   action: autoSaveProgress,
 *   shouldSetResponse: false,
 *   silentNetworkError: true
 * })
 */
type Props<T extends ActionResponse, TActionArgs extends unknown[]> = {
  action: (...args: TActionArgs) => Promise<T>
  onSuccess?: (data: T extends SuccessResponse<infer D> ? D : never, args: TActionArgs) => void
  onError?: (response: Extract<T, { ok: false }>) => void
  onSettled?: (response: T) => void
  shouldSetResponse?: boolean
  silentNetworkError?: boolean
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

export default function useServerAction<T extends ActionResponse, TActionArgs extends unknown[]>({
  action,
  onSuccess,
  onError,
  shouldSetResponse = true,
  silentNetworkError,
}: Readonly<Props<T, TActionArgs>>) {
  const [response, setResponse] = useState<T>()
  const [isPending, startTransition] = useTransition()
  const queryClient = useQueryClient()

  function dispatchAction(...args: TActionArgs) {
    startTransition(async () => {
      try {
        const response = await action(...args)

        if (shouldSetResponse) {
          setResponse(response)
        }

        if (!response.ok) {
          if (response.status === 401) {
            queryClient.setQueriesData({ queryKey: QueryKeys.me }, () => null)
            amplitude.reset()
            showLoginRequiredToast()

            if (onError) {
              onError(response as Extract<T, { ok: false }>)
            }

            return
          }

          const error = response.error as T extends ErrorResponse<infer E> ? E : never

          if (typeof error === 'string') {
            if (response.status >= 400 && response.status < 500) {
              toast.warning(error)
            } else {
              toast.error('요청 처리 중 오류가 발생했어요')
            }
          } else if (Array.isArray(error)) {
            const firstError = error.find((err) => err !== undefined)

            if (firstError && typeof firstError === 'string') {
              if (response.status >= 400 && response.status < 500) {
                toast.warning(firstError)
              } else {
                toast.error('요청 처리 중 오류가 발생했어요')
              }
            }
          }

          if (onError) {
            onError(response as Extract<T, { ok: false }>)
          }
        } else {
          onSuccess?.(response.data as T extends SuccessResponse<infer D> ? D : never, args)
        }
      } catch (error) {
        if (error instanceof Error && !silentNetworkError) {
          if (!navigator.onLine) {
            toast.error('네트워크 연결을 확인해 주세요')
          } else {
            toast.error('요청 처리 중 오류가 발생했어요')
          }
        }
      }
    })
  }

  return [response, dispatchAction, isPending] as const
}
