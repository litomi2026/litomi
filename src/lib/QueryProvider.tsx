'use client'

import { sendGAEvent } from '@next/third-parties/google'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import ms from 'ms'
import { PropsWithChildren, useEffect } from 'react'
import { toast } from 'sonner'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import amplitude from '@/lib/amplitude/browser'
import { showAdultVerificationRequiredToast, showLiboExpansionRequiredToast, showLoginRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'
import { canAccessAdultRestrictedAPIs } from '@/utils/adult-verification'
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

export function isLiboExpansionRequiredProblem(typeUrl: string): boolean {
  const suffix = '/problems/libo-expansion-required'

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

function handleUnauthorizedError() {
  queryClient.setQueriesData({ queryKey: QueryKeys.me }, () => null)
  amplitude.reset()
  if (NEXT_PUBLIC_GA_ID) {
    sendGAEvent('config', NEXT_PUBLIC_GA_ID, { user_id: null })
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (error instanceof ProblemDetailsError) {
        if (error.status === 401) {
          handleUnauthorizedError()
          return
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
          showAdultVerificationRequiredToast({ username: getCachedUsername(queryClient) })
        } else if (error.status === 403 && isLiboExpansionRequiredProblem(error.type)) {
          showLiboExpansionRequiredToast(error.message)
        } else if (error.status === 401) {
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
        if (error.status === 401) {
          handleUnauthorizedError()
          showLoginRequiredToast()
          return
        }

        if (error.status === 403 && isAdultVerificationRequiredProblem(error.type)) {
          showAdultVerificationRequiredToast({ username: getCachedUsername(queryClient) })
          return
        }

        if (error.status === 403 && isLiboExpansionRequiredProblem(error.type)) {
          showLiboExpansionRequiredToast(error.message)
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

export default function QueryProvider({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <MeClientSync />
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  )
}

function MeClientSync() {
  const queryClient = useQueryClient()
  const { data: me } = useMeQuery()
  const userId = me?.id
  const username = me?.name
  const shouldPurgeAdultQueries = me !== undefined && !canAccessAdultRestrictedAPIs(me)

  const shouldShowAdultVerificationToast =
    me != null && me.adultVerification?.required === true && me.adultVerification.status === 'unverified'

  // NOTE: 로그인 사용자의 경우 유저 아이디를 설정하고 GA 이벤트를 전송해요.
  useEffect(() => {
    if (userId) {
      amplitude.setUserId(userId)
      if (NEXT_PUBLIC_GA_ID) {
        sendGAEvent('config', NEXT_PUBLIC_GA_ID, { user_id: userId })
      }
    }
  }, [userId])

  // NOTE: 성인인증이 필요한 경우 토스트를 표시해요.
  useEffect(() => {
    if (shouldShowAdultVerificationToast && username) {
      showAdultVerificationRequiredToast({ username })
    }
  }, [shouldShowAdultVerificationToast, username])

  // NOTE: 성인 관련 API 접근 불가 시 requireAdult 캐시는 항상 제거해요.
  useEffect(() => {
    if (shouldPurgeAdultQueries) {
      queryClient.removeQueries({ predicate: (query) => query.meta?.requiresAdult === true })
    }
  }, [queryClient, shouldPurgeAdultQueries])

  return null
}
