'use client'

import type { POSTV1RouletteSpinRequest, POSTV1RouletteSpinResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData, type ProblemDetailsError } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export function useRouletteSpinMutation() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1RouletteSpinResponse, ProblemDetailsError, POSTV1RouletteSpinRequest>({
    mutationFn: async ({ bet }) => {
      const url = new URL('/api/v1/points/roulette/spin', NEXT_PUBLIC_API_ORIGIN)
      const { data } = await fetchAPIData<POSTV1RouletteSpinResponse>(url, {
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
