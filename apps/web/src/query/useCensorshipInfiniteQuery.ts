import type { GETV1CensorshipResponse } from '@litomi/contracts'

import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { hasAdultAccess } from '@/utils/adult-verification'
import { fetchAPIData, withQuery } from '@/utils/api-request'

import useMeQuery from './useMeQuery'

type Params = {
  pageParam?: string
}

export async function fetchPaginatedCensorships({ pageParam }: Params) {
  const params = new URLSearchParams()

  if (pageParam) {
    params.set('cursor', pageParam)
  }

  const url = withQuery('/api/v1/censorship', params)
  const { data } = await fetchAPIData<GETV1CensorshipResponse>(url)
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
