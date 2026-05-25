'use client'

import type { POSTV1PointEarnResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData, type ProblemDetailsError } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export function useEarnPointMutation() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1PointEarnResponse, ProblemDetailsError, string>({
    mutationFn: async (token) => {
      const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/points/earn`

      const { data } = await fetchAPIData<POSTV1PointEarnResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      })

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.points })
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsTransactions })
    },
    meta: { suppressGlobalErrorToastForStatuses: [403] },
  })
}
