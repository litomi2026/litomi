import { useQuery } from '@tanstack/react-query'

import type { GETV1PointExpansionResponse } from '@/backend/api/v1/points/expansion'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type QueryOptions = {
  enabled?: boolean
}

export function useExpansionQuery({ enabled = true }: QueryOptions = {}) {
  return useQuery<GETV1PointExpansionResponse>({
    queryKey: QueryKeys.pointsExpansion,
    queryFn: async () => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/expansion`
      const { data } = await fetchWithErrorHandling<GETV1PointExpansionResponse>(url, { credentials: 'include' })
      return data
    },
    enabled,
  })
}
