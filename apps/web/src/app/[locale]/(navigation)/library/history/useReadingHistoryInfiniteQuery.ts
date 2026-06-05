import type { GETV1ReadingHistoryResponse } from '@litomi/contracts'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { apiPath, fetchAPIData } from '@/utils/api-request'
import { getLocalReadingHistoryArray } from '@/utils/reading-history-index'

import type { ReadingHistorySource } from './common'

type Options = {
  enabled?: boolean
  source: ReadingHistorySource
}

export default function useReadingHistoryInfiniteQuery({ enabled = true, source }: Options) {
  const locale = useLocale()

  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteReadingHistory(source, source === 'server' ? locale : undefined),
    queryFn: ({ pageParam }) =>
      source === 'local' ? fetchLocalReadingHistoryPaginated() : fetchReadingHistoryPaginated(pageParam, locale),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
    enabled,
    meta: source === 'server' ? { requiresAdult: true } : undefined,
  })
}

async function fetchLocalReadingHistoryPaginated(): Promise<GETV1ReadingHistoryResponse> {
  return {
    items: getLocalReadingHistoryArray(),
    nextCursor: null,
  }
}

async function fetchReadingHistoryPaginated(cursor: string | null, locale: string) {
  const params = new URLSearchParams({ locale })

  if (cursor) {
    params.set('cursor', cursor)
  }

  const url = apiPath('/api/v1/library/history', params)

  const { data } = await fetchAPIData<GETV1ReadingHistoryResponse>(url)
  return data
}
