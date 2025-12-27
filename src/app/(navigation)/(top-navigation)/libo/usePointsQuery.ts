import { useQuery } from '@tanstack/react-query'

import type { GETV1PointsResponse } from '@/backend/api/v1/points/get'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { handleResponseError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type QueryOptions = {
  enabled?: boolean
}

export function usePointsQuery({ enabled = true }: QueryOptions = {}) {
  return useQuery({
    queryKey: QueryKeys.points,
    queryFn: async () => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/points`
      const response = await fetch(url, { credentials: 'include' })
      return handleResponseError<GETV1PointsResponse>(response)
    },
    enabled,
  })
}
