import { useQuery } from '@tanstack/react-query'
import ms from 'ms'

import type { GETV1PointTurnstileResponse } from '@/backend/api/v1/points/turnstile'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling, ProblemDetailsError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export async function fetchPointsTurnstile() {
  try {
    const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/turnstile`
    const { data } = await fetchWithErrorHandling<GETV1PointTurnstileResponse>(url, { credentials: 'include' })
    return data
  } catch (error) {
    if (error instanceof ProblemDetailsError && error.status === 401) {
      return { verified: false } as const
    }
    throw error
  }
}

export default function usePointsTurnstileQuery(enabled: boolean) {
  return useQuery({
    queryKey: QueryKeys.pointsTurnstile,
    queryFn: fetchPointsTurnstile,
    enabled,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: ms('10 minutes'),
    gcTime: ms('10 minutes'),
  })
}
