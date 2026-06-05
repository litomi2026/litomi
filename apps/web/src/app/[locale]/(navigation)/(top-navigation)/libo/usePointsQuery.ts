import type { GETV1PointsResponse } from '@litomi/contracts'

import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

type QueryOptions = {
  enabled?: boolean
}

export function usePointsQuery({ enabled = true }: QueryOptions = {}) {
  return useQuery({
    queryKey: QueryKeys.points,
    queryFn: async () => {
      const url = '/api/v1/points'
      const { data } = await fetchAPIData<GETV1PointsResponse>(url)
      return data
    },
    enabled,
  })
}
