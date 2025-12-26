import { useQuery } from '@tanstack/react-query'

import type { PointsResponse } from '@/backend/api/v1/points/get'

import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

type QueryOptions = {
  enabled?: boolean
}

export function usePointsQuery({ enabled = true }: QueryOptions = {}) {
  return useQuery<PointsResponse>({
    queryKey: QueryKeys.points,
    queryFn: async () => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/points`
      const response = await fetch(url, { credentials: 'include' })
      return handleResponseError<PointsResponse>(response)
    },
    enabled,
  })
}
