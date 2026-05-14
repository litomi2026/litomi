import type { GETV1PointsResponse } from '@litomi/contracts/api/points'

import { QueryKeys } from '@litomi/domain/constants/query'
import { env } from '@litomi/env/env/client'
import { useQuery } from '@tanstack/react-query'

import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

type QueryOptions = {
  enabled?: boolean
}

export function usePointsQuery({ enabled = true }: QueryOptions = {}) {
  return useQuery({
    queryKey: QueryKeys.points,
    queryFn: async () => {
      const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/points`
      const { data } = await fetchWithErrorHandling<GETV1PointsResponse>(url, { credentials: 'include' })
      return data
    },
    enabled,
  })
}
