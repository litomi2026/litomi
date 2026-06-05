import type { GETV1PointsDonationsMeResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_APP_ORIGIN } = env

export async function fetchMyDonations(searchParams: URLSearchParams) {
  const url = new URL('/api/v1/points/donations/me', NEXT_PUBLIC_APP_ORIGIN)
  url.search = searchParams.toString()
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
