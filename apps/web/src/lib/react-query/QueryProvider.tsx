'use client'

import { isProblemType, problemCode } from '@litomi/http/problem-details'
import { environmentManager, MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import ms from 'ms'
import { PropsWithChildren } from 'react'
import { toast } from 'sonner'

import MyInfoSync from '@/components/MyInfoSync'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { showAdultVerificationRequiredToast, showLiboExpansionRequiredToast, showLoginRequiredToast } from '@/lib/toast'
import { isAuthenticationRequiredError, UserVisibleError } from '@/utils/api-request'
import { HTTPResponseError } from '@/utils/fetch-response'
import { ProblemDetailsError } from '@/utils/fetch-response'

import { handleUnauthorizedError } from './auth-state'

export function isAdultVerificationRequiredProblem(typeUrl: string): boolean {
  return isProblemType(typeUrl, problemCode.ADULT_VERIFICATION_REQUIRED)
}

export function isLiboExpansionRequiredProblem(typeUrl: string): boolean {
  return isProblemType(typeUrl, problemCode.LIBO_EXPANSION_REQUIRED)
}

export function shouldRetryError(error: unknown, failureCount: number, maxRetries = 3): boolean {
  if (failureCount >= maxRetries) {
    return false
  }

  if (error instanceof ProblemDetailsError || error instanceof HTTPResponseError) {
    return error.isRetryable
  }

  if (!(error instanceof Error)) {
    return false
  }

  const message = error.message.toLowerCase()
  return message.includes('fetch') || message.includes('network')
}

function showForbiddenProblemToast(queryClient: QueryClient) {
  const me = queryClient.getQueryData(QueryKeys.me)

  if (me) {
    showAdultVerificationRequiredToast()
    return
  }

  showLoginRequiredToast()
}

// SSR 중 useQuery/useQueries가 등록하는 쿼리는 이 클라이언트의 캐시에 남는다. 모듈 스코프 인스턴스를
// 서버에서 공유하면 고유 queryKey(예: manga id×locale)마다 엔트리가 누적돼 프로세스가 OOM까지 자란다.
function makeQueryClient() {
  const queryClient: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (error, query) => {
        if (error instanceof ProblemDetailsError) {
          if (isAuthenticationRequiredError(error)) {
            handleUnauthorizedError(queryClient)
          }

          const isToastEnabled =
            query.meta?.enableGlobalErrorToast === true ||
            query.meta?.enableGlobalErrorToastForStatuses?.includes(error.status) === true

          if (!isToastEnabled) {
            return
          }

          if (error.status >= 500) {
            toast.error(error.message || '요청 처리 중 오류가 발생했어요')
          } else if (error.status === 403 && isAdultVerificationRequiredProblem(error.type)) {
            showForbiddenProblemToast(queryClient)
          } else if (error.status === 403 && isLiboExpansionRequiredProblem(error.type)) {
            showLiboExpansionRequiredToast(error.message)
          } else if (isAuthenticationRequiredError(error)) {
            showLoginRequiredToast()
          } else if (error.status >= 400) {
            toast.warning(error.message || '요청을 처리할 수 없어요')
          }
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _onMutateResult, mutation) => {
        if (error instanceof ProblemDetailsError) {
          const isSuppressed = mutation.meta?.suppressGlobalErrorToastForStatuses?.includes(error.status) === true

          if (isAuthenticationRequiredError(error)) {
            handleUnauthorizedError(queryClient)

            if (!isSuppressed) {
              showLoginRequiredToast()
            }

            return
          }

          if (error.status === 403 && isAdultVerificationRequiredProblem(error.type)) {
            showForbiddenProblemToast(queryClient)
            return
          }

          if (error.status === 403 && isLiboExpansionRequiredProblem(error.type)) {
            showLiboExpansionRequiredToast(error.message)
            return
          }

          if (isSuppressed) {
            return
          }

          if (error.status >= 500) {
            toast.error(error.message || '요청 처리 중 오류가 발생했어요')
          } else if (error.status >= 400) {
            toast.warning(error.message || '요청을 처리할 수 없어요')
          }
          return
        }

        if (error instanceof UserVisibleError) {
          toast.error(error.message)
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
          if (error instanceof ProblemDetailsError || error instanceof HTTPResponseError) {
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

  return queryClient
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (environmentManager.isServer()) {
    return makeQueryClient()
  }

  browserQueryClient ??= makeQueryClient()
  return browserQueryClient
}

export default function QueryProvider({ children }: PropsWithChildren) {
  const queryClient = getQueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <MyInfoSync />
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}
