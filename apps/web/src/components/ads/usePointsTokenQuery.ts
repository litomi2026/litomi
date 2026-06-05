'use client'

import type { POSTV1PointTokenResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { shouldRetryError } from '@/lib/react-query/QueryProvider'
import { fetchAPIData, ProblemDetailsError } from '@/utils/api-request'

const { NEXT_PUBLIC_APP_ORIGIN } = env

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
      const url = new URL('/api/v1/points/token', NEXT_PUBLIC_APP_ORIGIN)

      const { data } = await fetchAPIData<POSTV1PointTokenResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
    meta: { enableGlobalErrorToastForStatuses: [500] },
  })
}
