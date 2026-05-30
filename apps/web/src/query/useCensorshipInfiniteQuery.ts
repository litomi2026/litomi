import type { GETV1CensorshipResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { hasAdultAccess } from '@/utils/adult-verification'
import { fetchAPIData } from '@/utils/api-request'

import useMeQuery from './useMeQuery'

const { NEXT_PUBLIC_API_ORIGIN } = env

type Params = {
  pageParam?: string
}

export async function fetchPaginatedCensorships({ pageParam }: Params) {
  const params = new URLSearchParams()

  if (pageParam) {
    params.set('cursor', pageParam)
  }

  const url = new URL('/api/v1/censorship', NEXT_PUBLIC_API_ORIGIN)
  url.search = params.toString()
  const { data } = await fetchAPIData<GETV1CensorshipResponse>(url, { credentials: 'include' })
  return data
}

export default function useCensorshipsInfiniteQuery() {
  const { data: me } = useMeQuery()

  return useInfiniteQuery({
    queryKey: QueryKeys.infiniteCensorships,
    queryFn: ({ pageParam }: Params) => fetchPaginatedCensorships({ pageParam }),
    enabled: hasAdultAccess(me),
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: undefined,
    meta: { requiresAdult: true, enableGlobalErrorToastForStatuses: [403] },
  })
}
