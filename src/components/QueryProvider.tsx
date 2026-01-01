'use client'

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import ms from 'ms'
import { PropsWithChildren } from 'react'
import { toast } from 'sonner'

import LoginPageLink from '@/components/LoginPageLink'
import { QueryKeys } from '@/constants/query'
import amplitude from '@/lib/amplitude/browser'
import { ProblemDetailsError, shouldRetryError } from '@/utils/react-query-error'

const LOGIN_REQUIRED_TOAST_ID = 'login-required'

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
    onError: (error) => {
      if (error instanceof ProblemDetailsError) {
        if (error.status === 401) {
          queryClient.setQueriesData({ queryKey: QueryKeys.me }, () => null)
          amplitude.reset()

          toast.warning(
            <div className="flex gap-2 items-center">
              <div>로그인이 필요해요</div>
              <LoginPageLink onClick={() => toast.dismiss(LOGIN_REQUIRED_TOAST_ID)}>로그인하기</LoginPageLink>
            </div>,
            { duration: ms('10 seconds'), id: LOGIN_REQUIRED_TOAST_ID },
          )
          return
        }

        if (error.status >= 500) {
          toast.error(error.message || '요청 처리 중 오류가 발생했어요')
        } else if (error.status >= 400) {
          toast.warning(error.message)
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
