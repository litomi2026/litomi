import type { GETV1PointExpansionResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

type QueryOptions = {
  enabled?: boolean
}

export function useExpansionQuery({ enabled = true }: QueryOptions = {}) {
  return useQuery<GETV1PointExpansionResponse>({
    queryKey: QueryKeys.pointsExpansion,
    queryFn: async () => {
      const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/points/expansion`
      const { data } = await fetchAPIData<GETV1PointExpansionResponse>(url, { credentials: 'include' })
      return data
    },
    enabled,
  })
}
