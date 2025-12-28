'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { POSTV1PointEarnResponse } from '@/backend/api/v1/points/earn'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'

import { parseRewardedAdsErrorResponse } from './util'

const { NEXT_PUBLIC_BACKEND_URL } = env

type RewardedAdsAPIError = {
  error: string
  code?: string
  remainingSeconds?: number
}

export function useEarnPoints() {
  const queryClient = useQueryClient()

  return useMutation<POSTV1PointEarnResponse, RewardedAdsAPIError, string>({
    mutationFn: async (token) => {
      const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/earn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        throw await parseRewardedAdsErrorResponse(response)
      }

      return (await response.json()) as POSTV1PointEarnResponse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.points })
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsTransactions })
    },
  })
}
