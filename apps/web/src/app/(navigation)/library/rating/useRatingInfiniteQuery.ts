import type { GETV1RatingsResponse } from '@litomi/contracts'

import { RatingSort } from '@litomi/domain/library/sort'
import { env } from '@litomi/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function fetchRatingsPaginated(cursor: string, sort: RatingSort) {
  const searchParams = new URLSearchParams()

  if (cursor) {
    searchParams.set('cursor', cursor)
  }

  if (sort) {
    searchParams.set('sort', sort)
  }

  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/library/rating?${searchParams}`
  const { data } = await fetchAPIData<GETV1RatingsResponse>(url, { credentials: 'include' })
  return data
}

export default function useRatingInfiniteQuery(
  initialData?: GETV1RatingsResponse,
  sort: RatingSort = RatingSort.UPDATED_DESC,
) {
  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteRatings(sort),
    queryFn: ({ pageParam }) => fetchRatingsPaginated(pageParam, sort),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    ...(initialData && { initialData: { pages: [initialData], pageParams: [''] } }),
    initialPageParam: '',
  })
}
