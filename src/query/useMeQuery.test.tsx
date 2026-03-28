import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

import useMeQuery from './useMeQuery'

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('useMeQuery', () => {
  let queryClient: QueryClient
  const originalFetch = global.fetch
  const fetchMock = mock(originalFetch)

  beforeEach(() => {
    document.cookie = 'ah=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'
    fetchMock.mockReset()
    fetchMock.mockImplementation(originalFetch)
    global.fetch = fetchMock as unknown as typeof fetch
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
    global.fetch = originalFetch
  })

  test('auth hint가 없으면 즉시 비로그인 상태로 확정한다', () => {
    const { result } = renderHook(() => useMeQuery(), {
      wrapper: createWrapper(queryClient),
    })

    expect(result.current.data).toBeNull()
    expect(result.current.isPending).toBe(false)
    expect(result.current.isSuccess).toBe(true)
  })

  test('auth hint가 생기면 me 정보를 다시 요청한다', async () => {
    const fetchMeResponse = async () => {
      return new Response(
        JSON.stringify({
          id: 1,
          loginId: 'tester',
          name: 'alice',
          nickname: 'Alice',
          imageURL: null,
          adultVerification: { required: true, status: 'adult' },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      )
    }

    fetchMock.mockImplementation(fetchMeResponse as unknown as typeof fetch)

    const { result, rerender } = renderHook(() => useMeQuery(), {
      wrapper: createWrapper(queryClient),
    })

    expect(result.current.data).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()

    document.cookie = 'ah=1; path=/'
    rerender()

    await waitFor(() => {
      expect(result.current.data?.id).toBe(1)
    })

    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
