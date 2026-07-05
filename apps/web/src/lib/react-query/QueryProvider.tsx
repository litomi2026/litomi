'use client'

import { PROBLEM } from '@litomi/contracts'
import { isProblemType } from '@litomi/http/problem-details'
import { environmentManager, MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import ms from 'ms'
import type { PropsWithChildren } from 'react'
import { toast } from 'sonner'

import MyInfoSync from '@/components/MyInfoSync'
import { getErrorToastKind } from '@/lib/error-policy'
import { QueryKeys } from '@/lib/react-query/query-keys'
import {
  ProblemMessage,
  showAdultVerificationRequiredToast,
  showLiboExpansionRequiredToast,
  showLoginRequiredToast,
  TranslatedMessage,
} from '@/lib/toast'
import { UserVisibleError } from '@/utils/api-request'
import { HTTPResponseError, ProblemDetailsError } from '@/utils/fetch-response'

import { handleUnauthorizedError } from './auth-state'

export function isAdultVerificationRequiredProblem(typeUrl: string): boolean {
  return isProblemType(typeUrl, PROBLEM.ADULT_VERIFICATION_REQUIRED.slug)
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
          const kind = getErrorToastKind(error.type)

          if (kind === 'authRequired') {
            handleUnauthorizedError(queryClient)
          }

          const isToastEnabled =
            query.meta?.enableGlobalErrorToast === true ||
            query.meta?.enableGlobalErrorToastForStatuses?.includes(error.status) === true

          if (!isToastEnabled) {
            return
          }

          if (kind === 'authRequired') {
            showLoginRequiredToast()
          } else if (kind === 'adultOrLogin') {
            showForbiddenProblemToast(queryClient)
          } else if (kind === 'liboExpansion') {
            showLiboExpansionRequiredToast()
          } else if (error.status >= 500) {
            toast.error(<ProblemMessage problem={error.problem} />)
          } else if (error.status >= 400) {
            toast.warning(<ProblemMessage problem={error.problem} />)
          }
        }
      },
    }),
    mutationCache: new MutationCache({
      onError: (error, _variables, _onMutateResult, mutation) => {
        if (error instanceof ProblemDetailsError) {
          const kind = getErrorToastKind(error.type)
          const isSuppressed = mutation.meta?.suppressGlobalErrorToastForStatuses?.includes(error.status) === true

          if (kind === 'authRequired') {
            handleUnauthorizedError(queryClient)

            if (!isSuppressed) {
              showLoginRequiredToast()
            }

            return
          }

          // adult/libo 전용 토스트는 원본과 동일하게 suppress 를 무시하고 항상 표시한다.
          if (kind === 'adultOrLogin') {
            showForbiddenProblemToast(queryClient)
            return
          }

          if (kind === 'liboExpansion') {
            showLiboExpansionRequiredToast()
            return
          }

          if (isSuppressed) {
            return
          }

          if (error.status >= 500) {
            toast.error(<ProblemMessage problem={error.problem} />)
          } else if (error.status >= 400) {
            toast.warning(<ProblemMessage problem={error.problem} />)
          }
          return
        }

        if (error instanceof UserVisibleError) {
          toast.error(error.message)
          return
        }

        if (error instanceof Error) {
          if (navigator.onLine === false) {
            toast.error(<TranslatedMessage id="Errors.status.offline" />)
          } else {
            toast.error(<TranslatedMessage id="Errors.status.serverError" />)
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
