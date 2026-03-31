import '@test/setup.dom'

import type { ComponentType, ReactElement, ReactNode } from 'react'

import { QueryClient, type QueryClientConfig, QueryClientProvider } from '@tanstack/react-query'
import { render, type RenderOptions } from '@testing-library/react'

type RenderWithQueryClientOptions = Omit<RenderOptions, 'wrapper'> & {
  queryClient?: QueryClient
  wrapper?: ComponentType<{ children: ReactNode }>
}

export function createTestQueryClient(config: QueryClientConfig = {}) {
  const { defaultOptions, ...restConfig } = config

  return new QueryClient({
    ...restConfig,
    defaultOptions: {
      queries: {
        retry: false,
        retryOnMount: false,
        refetchOnReconnect: false,
        refetchOnWindowFocus: false,
        staleTime: Number.POSITIVE_INFINITY,
        gcTime: Number.POSITIVE_INFINITY,
        ...defaultOptions?.queries,
      },
      mutations: {
        retry: false,
        ...defaultOptions?.mutations,
      },
    },
  })
}

export function createTestQueryClientWrapper(
  queryClient: QueryClient,
  Wrapper?: ComponentType<{ children: ReactNode }>,
) {
  return function TestQueryClientWrapper({ children }: { children: ReactNode }) {
    const content = <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>

    if (!Wrapper) {
      return content
    }

    return <Wrapper>{content}</Wrapper>
  }
}

export function renderWithTestQueryClient(
  ui: ReactElement,
  { queryClient = createTestQueryClient(), wrapper, ...options }: RenderWithQueryClientOptions = {},
) {
  return {
    queryClient,
    ...render(ui, {
      wrapper: createTestQueryClientWrapper(queryClient, wrapper),
      ...options,
    }),
  }
}
