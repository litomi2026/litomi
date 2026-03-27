'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import amplitude from '@/lib/amplitude/browser'
import { identify } from '@/lib/analytics/browser'
import { showAdultVerificationRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'
import { AdultState, getAdultState, isAdultAccessBlocked } from '@/utils/adult-verification'

export default function MyInfoSync() {
  const queryClient = useQueryClient()
  const { data: me } = useMeQuery()
  const userId = me?.id
  const username = me?.name
  const adultState = getAdultState(me)
  const shouldPurgeAdultQueries = isAdultAccessBlocked(adultState)

  // NOTE: 로그인 사용자의 경우 GA, Amplitude 아이디를 설정해요
  useEffect(() => {
    if (userId) {
      amplitude.setUserId(userId)
      identify(userId)
    }
  }, [userId])

  // NOTE: 성인인증이 필요한 경우 토스트를 표시해요
  useEffect(() => {
    if (adultState === AdultState.UNVERIFIED) {
      showAdultVerificationRequiredToast({ username })
    }
  }, [adultState, username])

  // NOTE: 성인 관련 API 접근 불가 시 requireAdult 캐시를 제거해요
  useEffect(() => {
    if (shouldPurgeAdultQueries) {
      queryClient.removeQueries({ predicate: (query) => query.meta?.requiresAdult === true })
    }
  }, [queryClient, shouldPurgeAdultQueries])

  return null
}
