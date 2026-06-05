import type { GETV1PointExpansionResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_APP_ORIGIN } = env

type QueryOptions = {
  enabled?: boolean
}

export function useExpansionQuery({ enabled = true }: QueryOptions = {}) {
  return useQuery<GETV1PointExpansionResponse>({
    queryKey: QueryKeys.pointsExpansion,
    queryFn: async () => {
      const url = new URL('/api/v1/points/expansion', NEXT_PUBLIC_APP_ORIGIN)
      const { data } = await fetchAPIData<GETV1PointExpansionResponse>(url)
      return data
    },
    enabled,
  })
}
