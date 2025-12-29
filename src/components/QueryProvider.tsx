'use client'

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import ms from 'ms'
import { PropsWithChildren } from 'react'

import { QueryKeys } from '@/constants/query'
import amplitude from '@/lib/amplitude/browser'
import { ProblemDetailsError, shouldRetryError } from '@/utils/react-query-error'

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
      if (error instanceof ProblemDetailsError && error.status === 401) {
        queryClient.setQueriesData({ queryKey: QueryKeys.me }, () => null)
        amplitude.reset()
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
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
