import type { GETV1ReadingHistoryResponse } from '@litomi/contracts/api/library'

import { env } from '@litomi/env/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchWithErrorHandling } from '@/utils/react-query-error'
import { getLocalReadingHistoryArray } from '@/utils/reading-history-index'

import type { ReadingHistorySource } from './common'

const { NEXT_PUBLIC_API_ORIGIN } = env

type Options = {
  initialData?: GETV1ReadingHistoryResponse
  source: ReadingHistorySource
}

export default function useReadingHistoryInfiniteQuery({ initialData, source }: Options) {
  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteReadingHistory(source),
    queryFn: ({ pageParam }) =>
      source === 'local' ? fetchLocalReadingHistoryPaginated() : fetchReadingHistoryPaginated(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    ...(source === 'server' && initialData && { initialData: { pages: [initialData], pageParams: [''] } }),
    initialPageParam: '',
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

  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/library/history?${params}`
  const { data } = await fetchWithErrorHandling<GETV1ReadingHistoryResponse>(url, { credentials: 'include' })
  return data
}
