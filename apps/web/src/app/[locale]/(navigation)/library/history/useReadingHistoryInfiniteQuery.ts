import type { GETV1ReadingHistoryResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'
import { getLocalReadingHistoryArray } from '@/utils/reading-history-index'

import type { ReadingHistorySource } from './common'

const { NEXT_PUBLIC_API_ORIGIN } = env

type Options = {
  enabled?: boolean
  source: ReadingHistorySource
}

export default function useReadingHistoryInfiniteQuery({ enabled = true, source }: Options) {
  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteReadingHistory(source),
    queryFn: ({ pageParam }) =>
      source === 'local' ? fetchLocalReadingHistoryPaginated() : fetchReadingHistoryPaginated(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
    enabled,
    meta: source === 'server' ? { requiresAdult: true } : undefined,
  })
}

async function fetchLocalReadingHistoryPaginated() {
  return {
    items: getLocalReadingHistoryArray(),
    nextCursor: null,
  }
}

async function fetchReadingHistoryPaginated(cursor: string | null) {
  const params = new URLSearchParams()

  if (cursor) {
    params.set('cursor', cursor)
  }

  const url = new URL('/api/v1/library/history', NEXT_PUBLIC_API_ORIGIN)
  url.search = params.toString()

  const { data } = await fetchAPIData<GETV1ReadingHistoryResponse>(url, { credentials: 'include' })
  return data
}
