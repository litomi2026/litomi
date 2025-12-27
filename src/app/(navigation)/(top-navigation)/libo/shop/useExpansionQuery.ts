import { useQuery } from '@tanstack/react-query'

import type { GETV1PointExpansionResponse } from '@/backend/api/v1/points/expansion'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { handleResponseError } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

type QueryOptions = {
  enabled?: boolean
}

export function useExpansionQuery({ enabled = true }: QueryOptions = {}) {
  return useQuery<GETV1PointExpansionResponse>({
    queryKey: QueryKeys.pointsExpansion,
    queryFn: async () => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/expansion`
      const response = await fetch(url, { credentials: 'include' })
      return handleResponseError<GETV1PointExpansionResponse>(response)
    },
    enabled,
  })
}
