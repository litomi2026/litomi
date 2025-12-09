import { useQuery } from '@tanstack/react-query'

import { NEXT_PUBLIC_BACKEND_URL } from '@/constants/env'
import { QueryKeys } from '@/constants/query'
import { handleResponseError } from '@/utils/react-query-error'

type ExpansionInfo = {
  base: number
  extra: number
  current: number
  max: number
  canExpand: boolean
  price: number
  unit: number
}

type ExpansionResponse = {
  library: ExpansionInfo
  history: ExpansionInfo
}

type PointsResponse = {
  balance: number
  totalEarned: number
  totalSpent: number
}

export function useExpansionQuery() {
  return useQuery<ExpansionResponse>({
    queryKey: QueryKeys.pointsExpansion,
    queryFn: async () => {
      const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/points/expansion`, { credentials: 'include' })
      return handleResponseError<ExpansionResponse>(response)
    },
  })
}

export function usePointsQuery() {
  return useQuery<PointsResponse>({
    queryKey: QueryKeys.points,
    queryFn: async () => {
      const response = await fetch(`${NEXT_PUBLIC_BACKEND_URL}/api/v1/points`, { credentials: 'include' })
      return handleResponseError<PointsResponse>(response)
    },
  })
}
