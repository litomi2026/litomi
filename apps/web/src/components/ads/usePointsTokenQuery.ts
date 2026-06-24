'use client'

import type { POSTV1PointTokenResponse } from '@litomi/contracts'

import { useQuery } from '@tanstack/react-query'
import { shouldRetryError } from '@/lib/react-query/QueryProvider'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'
import { ProblemDetailsError } from '@/utils/fetch-response'

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
      const url = '/api/v1/points/token'

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
