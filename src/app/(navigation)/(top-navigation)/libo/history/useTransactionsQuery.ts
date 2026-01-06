import { useInfiniteQuery } from '@tanstack/react-query'

import type { GETV1PointTransactionResponse } from '@/backend/api/v1/points/transactions'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type QueryOptions = {
  enabled?: boolean
}

export async function fetchTransactions(searchParams: URLSearchParams) {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/transactions?${searchParams}`
  const { data } = await fetchWithErrorHandling<GETV1PointTransactionResponse>(url, { credentials: 'include' })
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
