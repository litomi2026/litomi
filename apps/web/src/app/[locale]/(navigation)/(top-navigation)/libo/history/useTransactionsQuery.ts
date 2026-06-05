import type { GETV1PointTransactionResponse } from '@litomi/contracts'

import { useInfiniteQuery } from '@tanstack/react-query'
import { useLocale } from 'next-intl'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { apiPath, fetchAPIData } from '@/utils/api-request'

type QueryOptions = {
  enabled?: boolean
}

export async function fetchTransactions(searchParams: URLSearchParams) {
  const url = apiPath('/api/v1/points/transactions', searchParams)
  const { data } = await fetchAPIData<GETV1PointTransactionResponse>(url)
  return data
}

export function useTransactionsQuery({ enabled = true }: QueryOptions = {}) {
  const locale = useLocale()

  return useInfiniteQuery<GETV1PointTransactionResponse>({
    queryKey: QueryKeys.pointsTransactions(locale),
    queryFn: async ({ pageParam }) => {
      const params = new URLSearchParams()
      params.set('locale', locale)

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
