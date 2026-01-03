'use client'

import { useMutation } from '@tanstack/react-query'

import type { POSTV1PointTokenResponse } from '@/backend/api/v1/points/token'

import { env } from '@/env/client'
import { fetchWithErrorHandling, type ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export function useRequestTokenMutation(adSlotId: string) {
  return useMutation<POSTV1PointTokenResponse, ProblemDetailsError>({
    mutationFn: async () => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/token`

      const { data } = await fetchWithErrorHandling<POSTV1PointTokenResponse>(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ adSlotId }),
      })

      return data
    },
    meta: {
      suppressGlobalErrorToastForStatuses: [403, 429],
    },
  })
}
