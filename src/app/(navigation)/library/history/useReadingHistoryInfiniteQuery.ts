import { useInfiniteQuery } from '@tanstack/react-query'

import { GETV1ReadingHistoryResponse } from '@/backend/api/v1/library/history'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { handleResponseError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export async function fetchReadingHistoryPaginated(cursor: string | null) {
  const params = new URLSearchParams()

  if (cursor) {
    params.set('cursor', cursor)
  }

  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/history?${params}`
  const response = await fetch(url, { credentials: 'include' })
  return handleResponseError<GETV1ReadingHistoryResponse>(response)
}

export default function useReadingHistoryInfiniteQuery(initialData?: GETV1ReadingHistoryResponse) {
  return useInfiniteQuery<GETV1ReadingHistoryResponse, Error>({
    queryKey: QueryKeys.infiniteReadingHistory,
    queryFn: ({ pageParam }) => fetchReadingHistoryPaginated(pageParam as string | null),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: initialData && {
      pages: [initialData],
      pageParams: [null],
    },
    initialPageParam: null,
  })
}
