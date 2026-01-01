import { useQuery } from '@tanstack/react-query'

import type { GETV1AdsterraStatsResponse } from '@/backend/api/v1/adsterra/stats'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type QueryOptions = {
  enabled?: boolean
  finishDate: string
  startDate: string
}

export function useAdsterraStatsQuery({ startDate, finishDate, enabled = true }: QueryOptions) {
  return useQuery({
    queryKey: QueryKeys.adsterraStats(startDate, finishDate),
    queryFn: async () => {
      const params = new URLSearchParams({ start_date: startDate, finish_date: finishDate })
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/adsterra/stats?${params}`
      const { data } = await fetchWithErrorHandling<GETV1AdsterraStatsResponse>(url, { credentials: 'include' })
      return data
    },
    enabled,
  })
}
