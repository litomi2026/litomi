'use client'

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import ms from 'ms'
import { PropsWithChildren } from 'react'
import { toast } from 'sonner'

import { QueryKeys } from '@/constants/query'
import amplitude from '@/lib/amplitude/browser'
import { showAdultVerificationRequiredToast, showLoginRequiredToast } from '@/lib/toast'
import { ProblemDetailsError, shouldRetryError } from '@/utils/react-query-error'

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

function isAdultVerificationRequiredProblem(typeUrl: string): boolean {
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

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      if (error instanceof ProblemDetailsError && error.status === 401) {
        queryClient.setQueriesData({ queryKey: QueryKeys.me }, () => null)
        amplitude.reset()
      }
    },
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _onMutateResult, mutation) => {
      if (error instanceof ProblemDetailsError) {
        if (error.status === 401) {
          queryClient.setQueriesData({ queryKey: QueryKeys.me }, () => null)
          amplitude.reset()
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
      retryDelay: (attemptIndex) => Math.min(100 * 2 ** attemptIndex, 5000),
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
