'use client'

import type { POSTV1RouletteSpinRequest, POSTV1RouletteSpinResponse } from '@litomi/contracts'

import { env } from '@litomi/env/env/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchWithErrorHandling, type ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export function useRouletteSpinMutation() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1RouletteSpinResponse, ProblemDetailsError, POSTV1RouletteSpinRequest>({
    mutationFn: async ({ bet }) => {
      const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/points/roulette/spin`
      const { data } = await fetchWithErrorHandling<POSTV1RouletteSpinResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bet }),
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.points, exact: true })
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsTransactions })
    },
  })
}
