'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { POSTV1PointSpendRequest, POSTV1PointSpendResponse } from '@/backend/api/v1/points/spend'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling, type ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export function useSpendPointsMutation() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1PointSpendResponse, ProblemDetailsError, POSTV1PointSpendRequest>({
    mutationFn: async ({ type, itemId }) => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/spend`

      const { data } = await fetchWithErrorHandling<POSTV1PointSpendResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type, itemId }),
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.points })
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsExpansion })
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsTransactions })
    },
  })
}
