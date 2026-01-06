import { sendGAEvent } from '@next/third-parties/google'
import { useQuery } from '@tanstack/react-query'
import ms from 'ms'
import { useEffect } from 'react'

import { GETV1MeResponse } from '@/backend/api/v1/me'
import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import amplitude from '@/lib/amplitude/browser'
import { showAdultVerificationRequiredToast } from '@/lib/toast'
import { canAccessAdultRestrictedAPIs } from '@/utils/adult-verification'
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

  const me = result.data
  const userId = me?.id
  const username = me?.name
  const shouldShowToast = !canAccessAdultRestrictedAPIs(me)

  // NOTE: 로그인 사용자의 경우 유저 아이디를 설정하고 GA 이벤트를 전송합니다.
  useEffect(() => {
    if (userId) {
      amplitude.setUserId(userId)
      if (NEXT_PUBLIC_GA_ID) {
        sendGAEvent('config', NEXT_PUBLIC_GA_ID, { user_id: userId })
      }
    }
  }, [userId])

  // NOTE: 성인인증이 필요한 경우 토스트를 표시합니다.
  useEffect(() => {
    if (shouldShowToast) {
      showAdultVerificationRequiredToast({ username })
    }
  }, [username, shouldShowToast])

  return result
}
