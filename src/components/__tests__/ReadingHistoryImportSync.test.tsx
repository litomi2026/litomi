import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { PropsWithChildren } from 'react'

import {
  readLocalReadingHistoryEntry,
  writeLocalReadingHistoryEntry,
} from '@/utils/local-reading-history'

let meData:
  | {
      id: number
      adultVerification: {
        required: boolean
        status: 'adult' | 'not_adult' | 'unverified'
      }
    }
  | null = null

let shouldFailImport = false
const fetchCalls: Array<{ input: unknown; init?: RequestInit }> = []

mock.module('@/query/useMeQuery', () => ({
  default: () => ({ data: meData }),
}))

mock.module('@/utils/react-query-error', () => ({
  fetchWithErrorHandling: async (input: unknown, init?: RequestInit) => {
    fetchCalls.push({ input, init })

    if (shouldFailImport) {
      throw new Error('Import failed')
    }

    return {
      data: undefined,
      response: new Response(null, { status: 204 }),
    }
  },
}))

const { default: ReadingHistoryImportSync } = await import('../ReadingHistoryImportSync')

function renderWithClient(client: QueryClient) {
  function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }

  return render(<ReadingHistoryImportSync />, { wrapper: Wrapper })
}

describe('ReadingHistoryImportSync', () => {
  beforeEach(() => {
    meData = null
    shouldFailImport = false
    fetchCalls.length = 0
    sessionStorage.clear()
  })

  afterEach(() => {
    cleanup()
  })

  test('성인 제한 API 접근이 불가능하면 자동 import를 실행하지 않는다', async () => {
    meData = {
      id: 1,
      adultVerification: {
        required: true,
        status: 'unverified',
      },
    }
    writeLocalReadingHistoryEntry(123, { lastPage: 7, updatedAt: 1000, pending: true })

    renderWithClient(new QueryClient())

    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(fetchCalls).toHaveLength(0)
    expect(readLocalReadingHistoryEntry(123)?.pending).toBe(true)
  })

  test('pending 기록만 import하고 성공 시 synced 처리 후 query를 invalidate 한다', async () => {
    meData = {
      id: 1,
      adultVerification: {
        required: true,
        status: 'adult',
      },
    }
    writeLocalReadingHistoryEntry(123, { lastPage: 7, updatedAt: 1000, pending: true })
    writeLocalReadingHistoryEntry(456, { lastPage: 3, updatedAt: 500, pending: false })

    const queryClient = new QueryClient()
    const invalidations: unknown[] = []
    queryClient.invalidateQueries = ((filters: unknown) => {
      invalidations.push(filters)
      return Promise.resolve()
    }) as typeof queryClient.invalidateQueries

    renderWithClient(queryClient)

    await waitFor(() => {
      expect(fetchCalls).toHaveLength(1)
    })

    const body = JSON.parse(String(fetchCalls[0]?.init?.body)) as {
      items: Array<{ mangaId: number; lastPage: number; updatedAt: number }>
    }
    expect(body.items).toEqual([{ mangaId: 123, lastPage: 7, updatedAt: 1000 }])

    await waitFor(() => {
      expect(readLocalReadingHistoryEntry(123)?.pending).toBe(false)
    })

    expect(readLocalReadingHistoryEntry(456)?.pending).toBe(false)
    expect(invalidations).toEqual([{ queryKey: ['me', 'readingHistory'] }])
  })

  test('import 실패 시 로컬 pending 기록을 유지한다', async () => {
    meData = {
      id: 1,
      adultVerification: {
        required: true,
        status: 'adult',
      },
    }
    shouldFailImport = true
    writeLocalReadingHistoryEntry(123, { lastPage: 7, updatedAt: 1000, pending: true })

    renderWithClient(new QueryClient())

    await waitFor(() => {
      expect(fetchCalls).toHaveLength(1)
    })

    expect(readLocalReadingHistoryEntry(123)?.pending).toBe(true)
  })
})
