import type { GETV1PointTransactionResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

type QueryOptions = {
  enabled?: boolean
}

export async function fetchTransactions(searchParams: URLSearchParams) {
  const url = new URL('/api/v1/points/transactions', NEXT_PUBLIC_API_ORIGIN)
  url.search = searchParams.toString()
  const { data } = await fetchAPIData<GETV1PointTransactionResponse>(url, { credentials: 'include' })
  return data
}

export function useTransactionsQuery({ enabled = true }: QueryOptions = {}) {
  return useInfiniteQuery<GETV1PointTransactionResponse>({
    queryKey: QueryKeys.pointsTransactions,
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()

      if (pageParam) {
        params.set('cursor', pageParam.toString())
      }

      return fetchTransactions(params)
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
    enabled,
    meta: { requiresAdult: true },
  })
}
