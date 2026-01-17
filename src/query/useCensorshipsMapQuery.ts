import { useQuery } from '@tanstack/react-query'

import type { CensorshipItem, GETV1CensorshipResponse } from '@/backend/api/v1/censorship/GET'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import { canAccessAdultRestrictedAPIs } from '@/utils/adult-verification'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

import useMeQuery from './useMeQuery'

const { NEXT_PUBLIC_BACKEND_URL } = env

export async function fetchCensorshipsMap() {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/censorship`
  const { data } = await fetchWithErrorHandling<GETV1CensorshipResponse>(url, { credentials: 'include' })
  const lookup = new Map<string, CensorshipItem>()

  for (const censorship of data.censorships) {
    const key = `${censorship.key}:${censorship.value.toLowerCase()}`
    lookup.set(key, censorship)
  }

  return lookup
}

export default function useCensorshipsMapQuery() {
  const { data: me } = useMeQuery()
  const userId = me?.id
  const canAccess = canAccessAdultRestrictedAPIs(me)

  return useQuery({
    queryKey: QueryKeys.censorship,
    queryFn: fetchCensorshipsMap,
    enabled: Boolean(userId) && canAccess,
    meta: { requiresAdult: true, enableGlobalErrorToastForStatuses: [403] },
  })
}
