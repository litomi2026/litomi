import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import useMeQuery from './useMeQuery'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useMeQuery', () => {
  let queryClient: QueryClient

  beforeEach(() => {
    document.cookie = 'ah=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    })
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
  })

  test('auth hint가 없으면 즉시 비로그인 상태로 확정한다', () => {
    const { result } = renderHook(() => useMeQuery(), {
      wrapper: createWrapper(queryClient),
    })

    expect(result.current.data).toBeNull()
    expect(result.current.isPending).toBe(false)
    expect(result.current.isSuccess).toBe(true)
  })
})
