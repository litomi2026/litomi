import { useInfiniteQuery } from '@tanstack/react-query'

import { GETRatingsResponse } from '@/app/api/rating/route'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

export type RatingSortOption = 'created-desc' | 'rating-asc' | 'rating-desc' | 'updated-desc'

export async function fetchRatingsPaginated(cursor: string | null, sort: RatingSortOption) {
  const searchParams = new URLSearchParams()

  if (cursor) {
    searchParams.set('cursor', cursor)
  }

  if (sort) {
    searchParams.set('sort', sort)
  }

  const response = await fetch(`/api/rating?${searchParams}`)
  return handleResponseError<GETRatingsResponse>(response)
}

export default function useRatingInfiniteQuery(
  initialData?: GETRatingsResponse,
  sort: RatingSortOption = 'updated-desc',
) {
  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteRatings(sort),
    queryFn: ({ pageParam }: { pageParam: string | null }) => fetchRatingsPaginated(pageParam, sort),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialData: initialData && {
      pages: [initialData],
      pageParams: [null],
    },
    initialPageParam: null,
  })
}
