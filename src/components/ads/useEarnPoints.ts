'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { POSTV1PointEarnResponse } from '@/backend/api/v1/points/earn'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling, type ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export function useEarnPoints() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1PointEarnResponse, ProblemDetailsError, string>({
    mutationFn: async (token) => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/earn`

      const { data } = await fetchWithErrorHandling<POSTV1PointEarnResponse>(url, {
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
  })
}
