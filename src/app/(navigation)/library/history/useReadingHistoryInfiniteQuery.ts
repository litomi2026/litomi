import { useInfiniteQuery } from '@tanstack/react-query'

import { GETV1ReadingHistoryResponse } from '@/backend/api/v1/library/history'
import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

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
