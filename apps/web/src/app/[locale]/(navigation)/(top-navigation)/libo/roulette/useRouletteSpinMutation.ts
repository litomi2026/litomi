'use client'

import type { POSTV1RouletteSpinRequest, POSTV1RouletteSpinResponse } from '@litomi/contracts'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ProblemDetailsError } from '@/utils/fetch-response'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

export function useRouletteSpinMutation() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1RouletteSpinResponse, ProblemDetailsError, POSTV1RouletteSpinRequest>({
    mutationFn: async ({ bet }) => {
      const url = '/api/v1/points/roulette/spin'
      const { data } = await fetchAPIData<POSTV1RouletteSpinResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bet }),
      })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.points, exact: true })
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsTransactionsBase })
    },
  })
}
