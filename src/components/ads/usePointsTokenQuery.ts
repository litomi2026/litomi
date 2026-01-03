'use client'

import { useQuery } from '@tanstack/react-query'

import type { POSTV1PointTokenResponse } from '@/backend/api/v1/points/token'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { shouldRetryError } from '@/lib/QueryProvider'
import { fetchWithErrorHandling, ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Options = {
  adSlotId: string
  enabled: boolean
}

export function usePointsTokenQuery({ adSlotId, enabled }: Options) {
  return useQuery({
    queryKey: QueryKeys.pointsToken(adSlotId),
    enabled,
    staleTime: Infinity,
    queryFn: async () => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/token`

      const { data } = await fetchWithErrorHandling<POSTV1PointTokenResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adSlotId }),
      })

      return data
    },
    retry: (failureCount, error) => {
      if (error instanceof ProblemDetailsError && error.status === 429 && error.retryAfterSeconds != null) {
        return false
      }
      return shouldRetryError(error, failureCount)
    },
    meta: {
      suppressGlobalErrorToastForStatuses: [403, 429],
    },
  })
}
