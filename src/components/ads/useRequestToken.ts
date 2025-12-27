'use client'

import { useMutation } from '@tanstack/react-query'

import type { POSTV1PointTokenResponse } from '@/backend/api/v1/points/token'

import { env } from '@/env/client'

import { parseRewardedAdsErrorResponse } from './util'

const { NEXT_PUBLIC_BACKEND_URL } = env

type RewardedAdsAPIError = {
  error: string
  code?: string
  remainingSeconds?: number
}

export function useRequestToken(adSlotId: string) {
  return useMutation<POSTV1PointTokenResponse, RewardedAdsAPIError>({
    mutationFn: async () => {
      const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adSlotId }),
      })

      if (!response.ok) {
        throw await parseRewardedAdsErrorResponse(response)
      }

      return (await response.json()) as POSTV1PointTokenResponse
    },
  })
}
