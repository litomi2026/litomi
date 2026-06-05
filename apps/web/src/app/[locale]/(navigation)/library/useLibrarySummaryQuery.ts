import type { GETV1LibrarySummaryResponse } from '@litomi/contracts'

import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import useMeQuery from '@/query/useMeQuery'
import { hasAdultAccess } from '@/utils/adult-verification'
import { fetchAPIData } from '@/utils/api-request'

type Options = {
  userId?: number
}

export async function fetchLibrarySummary() {
  const url = '/api/v1/library/summary'
  const { data } = await fetchAPIData<GETV1LibrarySummaryResponse>(url)
  return data
}

export default function useLibrarySummaryQuery({ userId }: Options) {
  const { data: me } = useMeQuery()

  return useQuery({
    queryKey: QueryKeys.librarySummary(userId),
    queryFn: fetchLibrarySummary,
    enabled: hasAdultAccess(me),
    meta: { requiresAdult: true },
  })
}
