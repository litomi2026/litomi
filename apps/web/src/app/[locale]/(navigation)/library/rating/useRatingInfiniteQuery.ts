import type { GETV1RatingsResponse } from '@litomi/contracts'

import { RatingSort } from '@litomi/domain/library/sort'
import { env } from '@litomi/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_APP_ORIGIN } = env

type Options = {
  enabled?: boolean
  sort?: RatingSort
}

export async function fetchRatingsPaginated(cursor: string, sort: RatingSort, locale: string) {
  const searchParams = new URLSearchParams({ locale })

  if (cursor) {
    searchParams.set('cursor', cursor)
  }

  if (sort) {
    searchParams.set('sort', sort)
  }

  const url = new URL('/api/v1/library/rating', NEXT_PUBLIC_APP_ORIGIN)
  url.search = searchParams.toString()
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
