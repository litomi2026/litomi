import type { GETV1MeResponse } from '@litomi/contracts'

import { CookieKey } from '@litomi/domain/constants/storage'
import { env } from '@litomi/env/client'
import { useQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import ms from 'ms'
import { useEffect, useState } from 'react'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function fetchMe() {
  const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/me`
  const { data } = await fetchWithErrorHandling<GETV1MeResponse>(url, { credentials: 'include' })
  return data
}

export function getMeQueryFetchOptions() {
  return {
    queryKey: QueryKeys.me,
    queryFn: fetchMe,
  } as const
}

export default function useMeQuery() {
  const [hasAuthHint, setHasAuthHint] = useState<boolean | null>(null)

  useEffect(() => {
    setHasAuthHint(Cookies.get(CookieKey.AUTH_HINT) === '1')
  }, [])

  return useQuery<GETV1MeResponse | null>({
    ...getMeQueryFetchOptions(),
    enabled: hasAuthHint === true,
    placeholderData: hasAuthHint === false ? null : undefined,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: ms('1 hour'),
    gcTime: ms('1 hour'),
  })
}
