import { useQuery } from '@tanstack/react-query'
import Cookies from 'js-cookie'
import ms from 'ms'

import { GETV1MeResponse } from '@/backend/api/v1/me'
import { QueryKeys } from '@/constants/query'
import { CookieKey } from '@/constants/storage'
import { env } from '@/env/client'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export async function fetchMe() {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/me`
  const { data } = await fetchWithErrorHandling<GETV1MeResponse>(url, { credentials: 'include' })
  return data
}

export default function useMeQuery() {
  return useQuery({
    queryKey: QueryKeys.me,
    queryFn: fetchMe,
    enabled: Cookies.get(CookieKey.AUTH_HINT) === '1',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: ms('1 hour'),
    gcTime: ms('1 hour'),
  })
}
