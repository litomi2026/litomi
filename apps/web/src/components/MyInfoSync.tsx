'use client'

import type { GETV1MeResponse } from '@litomi/contracts'

import { patchUserSettings, type UserSettingsSignal } from '@litomi/domain/utils/user-settings'
import { safeParseJSON } from '@litomi/std'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'

import { identify } from '@/lib/analytics/browser'
import { QueryKeys } from '@/lib/react-query/query-keys'
import useMeQuery from '@/query/useMeQuery'
import { LocalStorageKey } from '@/storage'
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
