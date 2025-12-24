'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'

import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'

type RewardedAdsAPIError = {
  error: string
  code?: string
  remainingSeconds?: number
}

type RewardedAdsEarnResponse = {
  success: boolean
  balance: number
  earned: number
  dailyRemaining: number
}

export function useEarnPoints() {
  const queryClient = useQueryClient()

  return useMutation<RewardedAdsEarnResponse, RewardedAdsAPIError, string>({
    mutationFn: async (token) => {
      const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/earn`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ token }),
      })
      const data = (await response.json()) as unknown

      if (!response.ok) {
        throw data as RewardedAdsAPIError
      }

      return data as RewardedAdsEarnResponse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.points })
      queryClient.invalidateQueries({ queryKey: QueryKeys.pointsTransactions })
    },
  })
}
