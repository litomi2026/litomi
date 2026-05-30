import type { GETV1PointsResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

type QueryOptions = {
  enabled?: boolean
}

export function usePointsQuery({ enabled = true }: QueryOptions = {}) {
  return useQuery({
    queryKey: QueryKeys.points,
    queryFn: async () => {
      const url = new URL('/api/v1/points', NEXT_PUBLIC_API_ORIGIN)
      const { data } = await fetchAPIData<GETV1PointsResponse>(url, { credentials: 'include' })
      return data
    },
    enabled,
  })
}
