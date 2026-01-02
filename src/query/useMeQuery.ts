import { sendGAEvent } from '@next/third-parties/google'
import { useQuery } from '@tanstack/react-query'
import ms from 'ms'
import { useEffect } from 'react'

import { GETV1MeResponse } from '@/backend/api/v1/me'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import amplitude from '@/lib/amplitude/browser'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL, NEXT_PUBLIC_GA_ID } = env

export async function fetchMe() {
  const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/me`
  const { data } = await fetchWithErrorHandling<GETV1MeResponse>(url, { credentials: 'include' })
  return data
}

export default function useMeQuery() {
  const result = useQuery({
    queryKey: QueryKeys.me,
    queryFn: fetchMe,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: false,
    staleTime: ms('1 hour'),
    gcTime: ms('1 hour'),
  })

  const userId = result.data?.id

  useEffect(() => {
    if (userId) {
      amplitude.setUserId(userId)
      if (NEXT_PUBLIC_GA_ID) {
        sendGAEvent('config', NEXT_PUBLIC_GA_ID, { user_id: userId })
      }
    }
  }, [userId])

  return result
}
