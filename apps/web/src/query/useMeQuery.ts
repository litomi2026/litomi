import type { GETV1MeResponse } from '@litomi/contracts'

import { env } from '@litomi/env/client'
import { CookieKey } from '@litomi/http/cookie'
import { useQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import ms from 'ms'
import { useEffect, useState } from 'react'

import { QueryKeys } from '@/lib/react-query/query-keys'
import { fetchAPIData } from '@/utils/api-request'

const { NEXT_PUBLIC_API_ORIGIN } = env

export async function fetchMe() {
  const url = new URL('/api/v1/me', NEXT_PUBLIC_API_ORIGIN)
  const { data } = await fetchAPIData<GETV1MeResponse>(url, { credentials: 'include' })
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
