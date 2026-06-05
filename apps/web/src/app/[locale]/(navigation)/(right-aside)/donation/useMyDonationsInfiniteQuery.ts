import type { GETV1PointsDonationsMeResponse } from '@litomi/contracts'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { apiPath, fetchAPIData } from '@/utils/api-request'

export async function fetchMyDonations(searchParams: URLSearchParams) {
  const url = apiPath('/api/v1/points/donations/me', searchParams)
  const { data } = await fetchAPIData<GETV1PointsDonationsMeResponse>(url)
  return data
}

export default function useMyDonationsInfiniteQuery(enabled = true) {
  const locale = useLocale()

  return useInfiniteQuery<GETV1PointsDonationsMeResponse>({
    queryKey: QueryKeys.myDonations(locale),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams({ locale })
      if (pageParam) {
        params.set('cursor', pageParam.toString())
      }
      return fetchMyDonations(params)
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
    enabled,
  })
}
