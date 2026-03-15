'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useRef, useState } from 'react'

import type { POSTV1LibraryHistoryImportBody } from '@/backend/api/v1/library/history/import'

import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'
import { canAccessAdultRestrictedAPIs } from '@/utils/adult-verification'
import {
  getPendingReadingHistorySnapshot,
  getPendingReadingHistorySnapshotKey,
  LOCAL_READING_HISTORY_UPDATED_EVENT,
  markReadingHistorySnapshotSyncedIfUnchanged,
} from '@/utils/local-reading-history'
import { fetchWithErrorHandling } from '@/utils/react-query-error'

const { NEXT_PUBLIC_BACKEND_URL } = env

export default function ReadingHistoryImportSync() {
  const { data: me } = useMeQuery()
  const canSync = canAccessAdultRestrictedAPIs(me)
  const queryClient = useQueryClient()
  const lastAttemptedSnapshotKeyRef = useRef<string | null>(null)
  const [localVersion, setLocalVersion] = useState(0)

  const importMutation = useMutation({
    mutationFn: async (body: POSTV1LibraryHistoryImportBody) => {
      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/library/history/import`

      await fetchWithErrorHandling<void>(url, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    },
    onSuccess: async (_, body) => {
      markReadingHistorySnapshotSyncedIfUnchanged(body.items)
      await queryClient.invalidateQueries({ queryKey: ['me', 'readingHistory'] })
    },
  })

  // NOTE: 로컬 읽기 기록 변경 이벤트를 구독해 pending snapshot을 다시 계산해요
  useEffect(() => {
    function handleLocalReadingHistoryUpdated() {
      setLocalVersion((version) => version + 1)
    }

    window.addEventListener(LOCAL_READING_HISTORY_UPDATED_EVENT, handleLocalReadingHistoryUpdated)

    return () => {
      window.removeEventListener(LOCAL_READING_HISTORY_UPDATED_EVENT, handleLocalReadingHistoryUpdated)
    }
  }, [])

  const pendingSnapshot = getPendingReadingHistorySnapshot()
  const snapshotKey = getPendingReadingHistorySnapshotKey(pendingSnapshot)

  // NOTE: pending snapshot이 비워지면 같은 스냅샷 재시도 방지 키도 함께 초기화해요
  useEffect(() => {
    if (!snapshotKey) {
      lastAttemptedSnapshotKeyRef.current = null
    }
  }, [snapshotKey])

  // NOTE: 로그인 및 성인 접근 가능 상태가 되면 현재 pending snapshot을 한 번만 import 해요
  useEffect(() => {
    if (!me || !canSync || !snapshotKey || importMutation.isPending) {
      return
    }

    if (lastAttemptedSnapshotKeyRef.current === snapshotKey) {
      return
    }

    lastAttemptedSnapshotKeyRef.current = snapshotKey
    importMutation.mutate({ items: pendingSnapshot })
  }, [canSync, importMutation, localVersion, me, pendingSnapshot, snapshotKey])

  return null
}
