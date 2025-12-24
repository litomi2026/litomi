'use client'

import { useMutation } from '@tanstack/react-query'

import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'

type RewardedAdsAPIError = {
  error: string
  code?: string
  remainingSeconds?: number
}

type RewardedAdsTokenResponse = {
  token: string
  expiresAt: string
  dailyRemaining: number
}

export function useRequestToken(adSlotId: string) {
  return useMutation<RewardedAdsTokenResponse, RewardedAdsAPIError>({
    mutationFn: async () => {
      const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adSlotId }),
      })

      const data = (await response.json()) as unknown

      if (!response.ok) {
        throw data as RewardedAdsAPIError
      }

      return data as RewardedAdsTokenResponse
    },
  })
}
