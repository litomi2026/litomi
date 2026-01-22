'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { POSTV1RouletteSpinRequest, POSTV1RouletteSpinResponse } from '@/backend/api/v1/points/roulette'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling, type ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export function useRouletteSpinMutation() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1RouletteSpinResponse, ProblemDetailsError, POSTV1RouletteSpinRequest>({
    mutationFn: async ({ bet }) => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/roulette/spin`
      const { data } = await fetchWithErrorHandling<POSTV1RouletteSpinResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bet }),
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.points })
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsTransactions })
    },
  })
}
