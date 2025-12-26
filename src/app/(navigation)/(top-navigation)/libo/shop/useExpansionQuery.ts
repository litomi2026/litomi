import { useQuery } from '@tanstack/react-query'

import type { GETV1PointExpansionResponse } from '@/backend/api/v1/points/expansion'

import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

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
