'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { PropsWithChildren } from 'react'

import { shouldRetryError } from '@/utils/react-query-error'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 300_000, // 5 minutes
      gcTime: 600_000, // 10 minutes
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
