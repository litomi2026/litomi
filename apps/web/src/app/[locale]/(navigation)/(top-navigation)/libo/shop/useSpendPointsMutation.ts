'use client'

import type { POSTV1PointSpendRequest, POSTV1PointSpendResponse } from '@litomi/contracts'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ProblemDetailsError } from '@/utils/fetch-response'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export function useSpendPointsMutation() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1PointSpendResponse, ProblemDetailsError, POSTV1PointSpendRequest>({
    mutationFn: async ({ type, itemId }) => {
      const url = '/api/v1/points/spend'

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
