import type { CensorshipItem, GETV1CensorshipResponse } from '@litomi/contracts'

import { MAX_CENSORSHIPS_PER_USER } from '@litomi/domain/censorship/policy'
import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { hasAdultAccess } from '@/utils/adult-verification'
import { buildSearchParams, fetchAPIData } from '@/utils/api-request'

import useMeQuery from './useMeQuery'

export async function fetchCensorshipsMap() {
  const params = buildSearchParams({ limit: MAX_CENSORSHIPS_PER_USER })
  const url = `/api/v1/censorship?${params}`
  const { data } = await fetchAPIData<GETV1CensorshipResponse>(url)
  const lookup = new Map<string, CensorshipItem>()

  for (const censorship of data.censorships) {
    const key = `${censorship.key}:${censorship.value.toLowerCase()}`
    lookup.set(key, censorship)
  }

  return lookup
}

export default function useCensorshipsMapQuery() {
  const { data: me } = useMeQuery()

  return useQuery({
    queryKey: QueryKeys.censorship,
    queryFn: fetchCensorshipsMap,
    enabled: hasAdultAccess(me),
    meta: { requiresAdult: true, enableGlobalErrorToastForStatuses: [403] },
  })
}
