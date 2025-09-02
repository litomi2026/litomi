import { useInfiniteQuery } from '@tanstack/react-query'

import { GETReadingHistoryResponse } from '@/app/api/reading-history/route'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

export async function fetchReadingHistoryPaginated(cursor: { updatedAt: number; mangaId: number } | null) {
  const searchParams = new URLSearchParams()

  if (cursor) {
    const encodedCursor = Buffer.from(JSON.stringify(cursor)).toString('base64')
    searchParams.append('cursor', encodedCursor)
  }

  const response = await fetch(`/api/reading-history?${searchParams}`)
  return handleResponseError<GETReadingHistoryResponse>(response)
}

export default function useReadingHistoryInfiniteQuery(initialData?: GETReadingHistoryResponse) {
  return useInfiniteQuery<GETReadingHistoryResponse, Error>({
    queryKey: QueryKeys.infiniteReadingHistory,
    queryFn: ({ pageParam }) =>
      fetchReadingHistoryPaginated(pageParam as { updatedAt: number; mangaId: number } | null),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: initialData && {
      pages: [initialData],
      pageParams: [null],
    },
    initialPageParam: null,
  })
}
