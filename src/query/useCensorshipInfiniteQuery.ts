import { useInfiniteQuery } from '@tanstack/react-query'

import type { GETV1CensorshipResponse } from '@/backend/api/v1/censorship/GET'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { canAccessAdultRestrictedAPIs } from '@/utils/adult-verification'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

import useMeQuery from './useMeQuery'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Params = {
  pageParam?: string
}

export async function fetchPaginatedCensorships({ pageParam }: Params) {
  const params = new URLSearchParams()

  if (pageParam) {
    params.set('cursor', pageParam)
  }

  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/censorship?${params}`
  const { data } = await fetchWithErrorHandling<GETV1CensorshipResponse>(url, { credentials: 'include' })
  return data
}

export default function useCensorshipsInfiniteQuery() {
  const { data: me } = useMeQuery()
  const userId = me?.id
  const canAccess = canAccessAdultRestrictedAPIs(me)

  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteCensorships,
    queryFn: ({ pageParam }: Params) => fetchPaginatedCensorships({ pageParam }),
    enabled: Boolean(userId) && canAccess,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    meta: { requiresAdult: true, enableGlobalErrorToastForStatuses: [403] },
  })
}
