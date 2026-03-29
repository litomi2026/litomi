import { useInfiniteQuery } from '@tanstack/react-query'

import type { GETV1ReadingHistoryResponse } from '@/backend/api/v1/library/history/GET'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Options = {
  initialData?: GETV1ReadingHistoryResponse
  enabled?: boolean
}

export async function fetchReadingHistoryPaginated(cursor: string | null) {
  const params = new URLSearchParams()

  if (cursor) {
    params.set('cursor', cursor)
  }

  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/history?${params}`
  const { data } = await fetchWithErrorHandling<GETV1ReadingHistoryResponse>(url, { credentials: 'include' })
  return data
}

export default function useReadingHistoryInfiniteQuery({ initialData, enabled = true }: Options = {}) {
  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteReadingHistory,
    queryFn: ({ pageParam }) => fetchReadingHistoryPaginated(pageParam),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    ...(initialData && { initialData: { pages: [initialData], pageParams: [''] } }),
    initialPageParam: '',
    enabled,
    meta: { requiresAdult: true },
  })
}
