import type { GETV1AdsterraStatsResponse } from '@litomi/contracts/api/adsterra'

import { QueryKeys } from '@litomi/domain/constants/query'
import { env } from '@litomi/env/env/client'
import { useQuery } from '@tanstack/react-query'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

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
      const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/adsterra/stats?${params}`
      const { data } = await fetchWithErrorHandling<GETV1AdsterraStatsResponse>(url, { credentials: 'include' })
      return data
    },
    enabled,
  })
}
