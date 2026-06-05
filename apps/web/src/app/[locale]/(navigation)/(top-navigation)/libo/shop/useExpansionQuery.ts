import type { GETV1PointExpansionResponse } from '@litomi/contracts'

import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

type QueryOptions = {
  enabled?: boolean
}

export function useExpansionQuery({ enabled = true }: QueryOptions = {}) {
  return useQuery<GETV1PointExpansionResponse>({
    queryKey: QueryKeys.pointsExpansion,
    queryFn: async () => {
      const url = '/api/v1/points/expansion'
      const { data } = await fetchAPIData<GETV1PointExpansionResponse>(url)
      return data
    },
    enabled,
  })
}
