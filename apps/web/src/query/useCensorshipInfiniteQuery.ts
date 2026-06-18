import type { GETV1CensorshipResponse } from '@litomi/contracts'

import { MAX_CENSORSHIPS_PER_USER } from '@litomi/domain/censorship/policy'
import { useInfiniteQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { hasAdultAccess } from '@/utils/adult-verification'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

import useMeQuery from './useMeQuery'

type Params = {
  pageParam?: string
}

export async function fetchPaginatedCensorships({ pageParam }: Params) {
  const params = buildSearchParams({
    limit: MAX_CENSORSHIPS_PER_USER,
    cursor: pageParam,
  })

  const url = `/api/v1/censorship?${params}`
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
