import type { GETV1RatingsResponse } from '@litomi/contracts'

import { RatingSort } from '@litomi/domain/library/sort'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

type Options = {
  enabled?: boolean
  sort?: RatingSort
}

export async function fetchRatingsPaginated(cursor: string, sort: RatingSort, locale: string) {
  const searchParams = buildSearchParams({ locale, cursor, sort })
  const url = `/api/v1/library/rating?${searchParams}`
  const { data } = await fetchAPIData<GETV1RatingsResponse>(url)
  return data
}

export default function useRatingInfiniteQuery({ enabled = true, sort = RatingSort.UPDATED_DESC }: Options = {}) {
  const locale = useLocale()

  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteRatings(sort, locale),
    queryFn: ({ pageParam }) => fetchRatingsPaginated(pageParam, sort, locale),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: '',
    enabled,
  })
}
