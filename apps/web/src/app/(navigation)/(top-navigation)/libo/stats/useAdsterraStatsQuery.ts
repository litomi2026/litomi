import type { GETV1AdsterraStatsResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

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
      const { data } = await fetchAPIData<GETV1AdsterraStatsResponse>(url, { credentials: 'include' })
      return data
    },
    enabled,
  })
}
