'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import type { GETV1MeResponse } from '@/backend/api/v1/me/GET'

import { QueryKeys } from '@/constants/query'
import { LocalStorageKey } from '@/constants/storage'
import amplitude from '@/lib/amplitude/browser'
import { identify } from '@/lib/analytics/browser'
import useMeQuery from '@/query/useMeQuery'
import { getAdultState, isAdultAccessBlocked } from '@/utils/adult-verification'
import { safeParseJSON } from '@/utils/json'
import { patchUserSettings, type UserSettingsSignal } from '@/utils/user-settings'

export default function MyInfoSync() {
  const queryClient = useQueryClient()
  const { data: me } = useMeQuery()
  const userId = me?.id
  const adultState = getAdultState(me)
  const shouldPurgeAdultQueries = isAdultAccessBlocked(adultState)

  // NOTE: 로그인 사용자의 경우 GA, Amplitude 아이디를 설정해요
  useEffect(() => {
    if (userId) {
      amplitude.setUserId(userId)
      identify(userId)
    }
  }, [userId])

  // NOTE: 성인 관련 API 접근 불가 시 requireAdult 캐시를 제거해요
  useEffect(() => {
    if (shouldPurgeAdultQueries) {
      queryClient.removeQueries({ predicate: (query) => query.meta?.requiresAdult === true })
    }
  }, [queryClient, shouldPurgeAdultQueries])

  // NOTE: 다른 탭에서 사용자 설정이 바뀌면 storage 이벤트로 me 캐시를 네트워크 없이 동기화해요
  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== LocalStorageKey.USER_SETTINGS_SIGNAL || !event.newValue) {
        return
      }

      const payload = safeParseJSON<UserSettingsSignal>(event.newValue)

      if (!payload || typeof payload.userId !== 'number') {
        return
      }

      queryClient.setQueryData<GETV1MeResponse | null>(QueryKeys.me, (current) => {
        if (!current || current.id !== payload.userId) {
          return current
        }

        return {
          ...current,
          settings: patchUserSettings(current.settings, payload.settings),
        }
      })
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [queryClient])

  return null
}
