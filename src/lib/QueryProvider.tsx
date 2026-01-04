'use client'

import { sendGAEvent } from '@next/third-parties/google'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import ms from 'ms'
import { PropsWithChildren } from 'react'
import { toast } from 'sonner'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import amplitude from '@/lib/amplitude/browser'
import { showAdultVerificationRequiredToast, showLoginRequiredToast } from '@/lib/toast'
import { ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_GA_ID } = env

export function isAdultVerificationRequiredProblem(typeUrl: string): boolean {
  const suffix = '/problems/adult-verification-required'

  if (typeUrl.endsWith(suffix)) {
    return true
  }

  try {
    return new URL(typeUrl).pathname === suffix
  } catch {
    return false
  }
}

export function shouldRetryError(error: unknown, failureCount: number, maxRetries = 3): boolean {
  if (failureCount >= maxRetries) {
    return false
  }

  if (error instanceof ProblemDetailsError) {
    return error.isRetryable
  }

  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return message.includes('fetch') || message.includes('network')
}

function getCachedUsername(queryClient: QueryClient): string | undefined {
  const me = queryClient.getQueryData(QueryKeys.me)
  if (!me || typeof me !== 'object') {
    return undefined
  }
  if (!('name' in me)) {
    return undefined
  }
  const name = me.name
  return typeof name === 'string' && name.length > 0 ? name : undefined
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (error instanceof ProblemDetailsError) {
        if (error.status === 401) {
          queryClient.setQueriesData({ queryKey: QueryKeys.me }, () => null)
          amplitude.reset()
          if (NEXT_PUBLIC_GA_ID) {
            sendGAEvent('config', NEXT_PUBLIC_GA_ID, { user_id: null })
          }
          return
        }

        if (error.status === 403 && isAdultVerificationRequiredProblem(error.type)) {
          showAdultVerificationRequiredToast({ username: getCachedUsername(queryClient) })
          return
        }

        if (query.meta?.suppressGlobalErrorToastForStatuses?.includes(error.status)) {
          return
        }

        if (error.status >= 400) {
          toast.warning(error.message || '요청을 처리할 수 없어요')
          return
        }
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _onMutateResult, mutation) => {
      if (error instanceof ProblemDetailsError) {
        if (error.status === 401) {
          queryClient.setQueriesData({ queryKey: QueryKeys.me }, () => null)
          amplitude.reset()
          if (NEXT_PUBLIC_GA_ID) {
            sendGAEvent('config', NEXT_PUBLIC_GA_ID, { user_id: null })
          }
          showLoginRequiredToast()
          return
        }

        if (error.status === 403 && isAdultVerificationRequiredProblem(error.type)) {
          showAdultVerificationRequiredToast({ username: getCachedUsername(queryClient) })
          return
        }

        if (mutation.meta?.suppressGlobalErrorToastForStatuses?.includes(error.status)) {
          return
        }

        if (error.status >= 500) {
          toast.error(error.message || '요청 처리 중 오류가 발생했어요')
        } else if (error.status >= 400) {
          toast.warning(error.message || '요청을 처리할 수 없어요')
        }
        return
      }

      if (error instanceof Error) {
        if (navigator.onLine === false) {
          toast.error('네트워크 연결을 확인해 주세요')
        } else {
          toast.error('요청 처리 중 오류가 발생했어요')
        }
      }
    },
  }),
  defaultOptions: {
    queries: {
      staleTime: ms('10 minutes'),
      gcTime: ms('20 minutes'),
      retry: (failureCount, error) => shouldRetryError(error, failureCount),
      retryDelay: (attemptIndex, error) => {
        if (error instanceof ProblemDetailsError) {
          const retryAfterSeconds = error.retryAfterSeconds
          if (retryAfterSeconds) {
            return retryAfterSeconds * ms('1s')
          }
        }
        return Math.min(ms('1s') * 2 ** attemptIndex, ms('5s'))
      },
      retryOnMount: false,
    },
  },
})

export default function QueryProvider({ children }: Readonly<PropsWithChildren>) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
