import type { GETV1LibrarySummaryResponse } from '@litomi/contracts/api/library'

import { env } from '@litomi/env/env/client'
import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import useMeQuery from '@/query/useMeQuery'
import { getAdultState, hasAdultAccess } from '@/utils/adult-verification'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

type Options = {
  userId?: number
}

export async function fetchLibrarySummary() {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/library/summary`
  const { data } = await fetchWithErrorHandling<GETV1LibrarySummaryResponse>(url, { credentials: 'include' })
  return data
}

export default function useLibrarySummaryQuery({ userId }: Options) {
  const { data: me } = useMeQuery()
  const adultState = getAdultState(me)

  return useQuery({
    queryKey: QueryKeys.librarySummary(userId),
    queryFn: fetchLibrarySummary,
    enabled: hasAdultAccess(adultState),
    meta: { requiresAdult: true },
  })
}
