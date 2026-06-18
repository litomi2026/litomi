import type { GETV1PointsDonationsMeResponse } from '@litomi/contracts'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

export async function fetchMyDonations(cursor: string | null, locale: string) {
  const searchParams = buildSearchParams({ cursor, locale })
  const url = `/api/v1/points/donations/me?${searchParams}`
  const { data } = await fetchAPIData<GETV1PointsDonationsMeResponse>(url)
  return data
}

export default function useMyDonationsInfiniteQuery(enabled = true) {
  const locale = useLocale()

  return useInfiniteQuery<GETV1PointsDonationsMeResponse>({
    queryKey: QueryKeys.myDonations(locale),
    queryFn: ({ pageParam }) => fetchMyDonations(pageParam as string | null, locale),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
    enabled,
  })
}
