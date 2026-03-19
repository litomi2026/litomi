'use client'

import { sendGAEvent } from '@next/third-parties/google'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { env } from '@/env/client'
import amplitude from '@/lib/amplitude/browser'
import { showAdultVerificationRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'
import { AdultState, getAdultState, isAdultAccessBlocked } from '@/utils/adult-verification'

const { NEXT_PUBLIC_GA_ID } = env

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
      if (NEXT_PUBLIC_GA_ID) {
        sendGAEvent('config', NEXT_PUBLIC_GA_ID, { user_id: userId })
      }
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
