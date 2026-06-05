'use client'

import type { POSTV1PointSpendRequest, POSTV1PointSpendResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData, type ProblemDetailsError } from '@/utils/api-request'

const { NEXT_PUBLIC_APP_ORIGIN } = env

export function useSpendPointsMutation() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1PointSpendResponse, ProblemDetailsError, POSTV1PointSpendRequest>({
    mutationFn: async ({ type, itemId }) => {
      const url = new URL('/api/v1/points/spend', NEXT_PUBLIC_APP_ORIGIN)

      const { data } = await fetchAPIData<POSTV1PointSpendResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, itemId }),
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.points })
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsExpansion })
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsTransactionsBase })
    },
  })
}
