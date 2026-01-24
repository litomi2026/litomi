import { useInfiniteQuery } from '@tanstack/react-query'

import type { GETV1PointsDonationsMeResponse } from '@/backend/api/v1/points/donations/GET'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export async function fetchMyDonations(searchParams: URLSearchParams) {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/donations/me?${searchParams}`
  const { data } = await fetchWithErrorHandling<GETV1PointsDonationsMeResponse>(url, { credentials: 'include' })
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
