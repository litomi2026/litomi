'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { POSTV1PointSpendRequest, POSTV1PointSpendResponse } from '@/backend/api/v1/points/spend'

import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'

export function useSpendPointsMutation() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1PointSpendResponse, { error: string }, POSTV1PointSpendRequest>({
    mutationFn: async ({ type, itemId }) => {
      const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/spend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type, itemId }),
      })
      const data = await response.json()
      if (!response.ok) throw data
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.points })
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsExpansion })
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsTransactions })
    },
  })
}
