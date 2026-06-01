'use client'

import type { GETV1MeResponse } from '@litomi/contracts'

import { patchUserSettings, type UserSettingsBroadcastMessage } from '@litomi/domain/utils/user-settings'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { identify } from '@/lib/analytics/browser'
import { QueryKeys } from '@/lib/react-query/query-keys'
import useMeQuery from '@/query/useMeQuery'
import { BroadcastChannelKey } from '@/storage'
import { hasAdultAccess } from '@/utils/adult-verification'

export default function MyInfoSync() {
  const queryClient = useQueryClient()
  const { data: me } = useMeQuery()
  const userId = me?.id
  const shouldPurgeAdultQueries = me !== undefined && !hasAdultAccess(me)

  // NOTE: 로그인 사용자의 경우 GA, Amplitude 아이디를 설정해요
  useEffect(() => {
    if (userId) {
      identify(userId)
    }
  }, [userId])

  // NOTE: 성인 관련 API 접근 불가 시 requireAdult 캐시를 제거해요
  useEffect(() => {
    if (shouldPurgeAdultQueries) {
      queryClient.removeQueries({ predicate: (query) => query.meta?.requiresAdult === true })
    }
  }, [queryClient, shouldPurgeAdultQueries])

  // NOTE: 다른 탭에서 사용자 설정이 바뀌면 BroadcastChannel로 me 캐시를 네트워크 없이 동기화해요
  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') {
      return
    }

    const channel = new BroadcastChannel(BroadcastChannelKey.USER_SETTINGS)

    channel.onmessage = (event: MessageEvent<UserSettingsBroadcastMessage>) => {
      queryClient.setQueryData<GETV1MeResponse | null>(QueryKeys.me, (current) => {
        if (!current || current.id !== event.data.userId) {
          return current
        }

        return {
          ...current,
          settings: patchUserSettings(current.settings, event.data.settings),
        }
      })
    }

    return () => channel.close()
  }, [queryClient])

  return null
}
