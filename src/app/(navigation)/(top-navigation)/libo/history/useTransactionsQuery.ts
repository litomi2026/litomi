import { useInfiniteQuery } from '@tanstack/react-query'

import type { GETV1PointTransactionResponse } from '@/backend/api/v1/points/transactions'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'

const { NEXT_PUBLIC_BACKEND_URL } = env

type QueryOptions = {
  enabled?: boolean
}

export function useTransactionsQuery({ enabled = true }: QueryOptions = {}) {
  return useInfiniteQuery<GETV1PointTransactionResponse>({
    queryKey: QueryKeys.pointsTransactions,
    queryFn: async ({ pageParam }) => {
      const params = pageParam ? `?cursor=${pageParam}` : ''
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/transactions${params}`
      const response = await fetch(url, { credentials: 'include' })
      if (!response.ok) {
        throw new Error('Failed to fetch transactions')
      }
      return response.json()
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: null,
    enabled,
  })
}
