import type { GETV1PointsDonationsMeResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function fetchMyDonations(searchParams: URLSearchParams) {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/points/donations/me?${searchParams}`
  const { data } = await fetchAPIData<GETV1PointsDonationsMeResponse>(url, { credentials: 'include' })
  return data
}

export default function useMyDonationsInfiniteQuery(enabled = true) {
  return useInfiniteQuery<GETV1PointsDonationsMeResponse>({
    queryKey: QueryKeys.myDonations,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
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
