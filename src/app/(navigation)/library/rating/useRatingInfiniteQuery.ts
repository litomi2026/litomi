import { useInfiniteQuery } from '@tanstack/react-query'

import { RatingSort } from '@/backend/api/v1/library/enum'
import { GETV1RatingsResponse } from '@/backend/api/v1/library/rating'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { handleResponseError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export async function fetchRatingsPaginated(cursor: string | null, sort: RatingSort) {
  const searchParams = new URLSearchParams()

  if (cursor) {
    searchParams.set('cursor', cursor)
  }

  if (sort) {
    searchParams.set('sort', sort)
  }

  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/rating?${searchParams}`
  const response = await fetch(url, { credentials: 'include' })
  return handleResponseError<GETV1RatingsResponse>(response)
}

export default function useRatingInfiniteQuery(
  initialData?: GETV1RatingsResponse,
  sort: RatingSort = RatingSort.UPDATED_DESC,
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
