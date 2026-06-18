import type { GETV1AdsterraStatsResponse } from '@litomi/contracts'

import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

type QueryOptions = {
  enabled?: boolean
  finishDate: string
  startDate: string
}

export function useAdsterraStatsQuery({ startDate, finishDate, enabled = true }: QueryOptions) {
  return useQuery({
    queryKey: QueryKeys.adsterraStats(startDate, finishDate),
    queryFn: async () => {
      const params = buildSearchParams({
        start_date: startDate,
        finish_date: finishDate,
      })

      const url = `/api/v1/adsterra/stats?${params}`
      const { data } = await fetchAPIData<GETV1AdsterraStatsResponse>(url)
      return data
    },
    enabled,
  })
}
