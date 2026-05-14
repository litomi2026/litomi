import '@test/setup.dom'

import type { GETV1MeResponse } from '@litomi/contracts'
import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

import { QueryKeys } from '@/lib/react-query/query-keys'

import usePatchMyProfileMutation from './usePatchMyProfileMutation'

function createMe(): GETV1MeResponse {
  return {
    id: 1,
    loginId: 'tester',
    name: 'alice',
    nickname: 'Alice',
    imageURL: 'https://example.com/avatar.png',
    adultVerification: { required: true, status: 'adult' },
    settings: {
      historySyncEnabled: true,
      adultVerifiedAdVisible: false,
      autoDeletionDay: 180,
    },
  }
}

function createWrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  }
}

describe('usePatchMyProfileMutation', () => {
  let queryClient: QueryClient
  const originalFetch = global.fetch
  const fetchMock = mock(originalFetch)

  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockImplementation(originalFetch)
    global.fetch = fetchMock as unknown as typeof fetch
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
        mutations: {
          retry: false,
        },
      },
    })
    queryClient.setQueryData(QueryKeys.me, createMe())
  })

  afterEach(() => {
    cleanup()
    queryClient.clear()
    global.fetch = originalFetch
  })

  test('mutate 직후 QueryKeys.me를 optimistic update 하고 성공 응답으로 확정한다', async () => {
    let resolveResponse!: (response: Response) => void
    fetchMock.mockImplementationOnce(
      (() =>
        new Promise<Response>((resolve) => {
          resolveResponse = resolve
        })) as unknown as typeof fetch,
    )

    const { result } = renderHook(() => usePatchMyProfileMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ nickname: 'Alice Prime' })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData<GETV1MeResponse>(QueryKeys.me)?.nickname).toBe('Alice Prime')
    })

    resolveResponse(
      new Response(
        JSON.stringify({
          message: '프로필을 수정했어요',
          name: 'alice',
          nickname: 'Alice Prime',
          imageURL: 'https://example.com/avatar.png',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true)
    })

    expect(queryClient.getQueryData<GETV1MeResponse>(QueryKeys.me)?.nickname).toBe('Alice Prime')
  })

  test('요청이 실패하면 optimistic update를 rollback 한다', async () => {
    let resolveResponse!: (response: Response) => void
    fetchMock.mockImplementationOnce(
      (() =>
        new Promise<Response>((resolve) => {
          resolveResponse = resolve
        })) as unknown as typeof fetch,
    )

    const { result } = renderHook(() => usePatchMyProfileMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ imageURL: null })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData<GETV1MeResponse>(QueryKeys.me)?.imageURL).toBeNull()
    })

    resolveResponse(
      new Response(
        JSON.stringify({
          type: 'https://litomi.in/problems/internal-server-error',
          title: '서버 오류가 발생했어요',
          status: 500,
          detail: '프로필 수정 중 오류가 발생했어요',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/problem+json' },
        },
      ),
    )

    await waitFor(() => {
      expect(result.current.isError).toBe(true)
    })

    expect(queryClient.getQueryData<GETV1MeResponse>(QueryKeys.me)?.imageURL).toBe('https://example.com/avatar.png')
  })
})
