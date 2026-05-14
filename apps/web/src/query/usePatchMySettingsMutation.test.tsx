import '@test/setup.dom'

import type { ReactNode } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

import type { GETV1MeResponse } from '@/backend/api/v1/me/GET'

import { QueryKeys } from '@/constants/query'
import { LocalStorageKey } from '@/constants/storage'

import usePatchMySettingsMutation from './usePatchMySettingsMutation'

function createMe(): GETV1MeResponse {
  return {
    id: 1,
    loginId: 'tester',
    name: 'alice',
    nickname: 'Alice',
    imageURL: null,
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

describe('usePatchMySettingsMutation', () => {
  let queryClient: QueryClient
  const originalFetch = global.fetch
  const fetchMock = mock(originalFetch)

  beforeEach(() => {
    fetchMock.mockReset()
    fetchMock.mockImplementation(originalFetch)
    global.fetch = fetchMock as unknown as typeof fetch
    localStorage.clear()
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
    localStorage.clear()
  })

  test('mutate 직후 QueryKeys.me.settings를 optimistic update 한다', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }))

    const { result } = renderHook(() => usePatchMySettingsMutation(), {
      wrapper: createWrapper(queryClient),
    })

    await act(async () => {
      result.current.mutate({ historySyncEnabled: false })
    })

    expect(queryClient.getQueryData<GETV1MeResponse>(QueryKeys.me)?.settings.historySyncEnabled).toBe(false)

    await waitFor(() => {
      expect(localStorage.getItem(LocalStorageKey.USER_SETTINGS_SIGNAL)).not.toBeNull()
    })

    expect(queryClient.getQueryData<GETV1MeResponse>(QueryKeys.me)?.settings.adultVerifiedAdVisible).toBe(false)
  })

  test('요청이 실패하면 optimistic update를 rollback 한다', async () => {
    let resolveResponse!: (response: Response) => void
    const pendingFetch = (() =>
      new Promise<Response>((resolve) => {
        resolveResponse = resolve
      })) as unknown as typeof fetch
    fetchMock.mockImplementationOnce(pendingFetch)

    const { result } = renderHook(() => usePatchMySettingsMutation(), {
      wrapper: createWrapper(queryClient),
    })

    act(() => {
      result.current.mutate({ adultVerifiedAdVisible: true })
    })

    await waitFor(() => {
      expect(queryClient.getQueryData<GETV1MeResponse>(QueryKeys.me)?.settings.adultVerifiedAdVisible).toBe(true)
    })

    resolveResponse(
      new Response(
        JSON.stringify({
          type: 'https://litomi.in/problems/http-500',
          title: 'Internal Server Error',
          status: 500,
          detail: '설정을 저장하지 못했어요',
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

    expect(queryClient.getQueryData<GETV1MeResponse>(QueryKeys.me)?.settings.adultVerifiedAdVisible).toBe(false)
  })
})
