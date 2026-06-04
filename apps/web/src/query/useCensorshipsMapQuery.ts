import type { CensorshipItem, GETV1CensorshipResponse } from '@litomi/contracts'

import { MAX_CENSORSHIPS_PER_USER } from '@litomi/domain/censorship/policy'
import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { hasAdultAccess } from '@/utils/adult-verification'
import { fetchAPIData } from '@/utils/api-request'

import useMeQuery from './useMeQuery'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function fetchCensorshipsMap() {
  const params = new URLSearchParams({ limit: MAX_CENSORSHIPS_PER_USER.toString() })
  const url = new URL('/api/v1/censorship', NEXT_PUBLIC_API_ORIGIN)
  url.search = params.toString()
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
