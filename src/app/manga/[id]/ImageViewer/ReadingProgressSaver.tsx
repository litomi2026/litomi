'use client'

import ms from 'ms'
import { useEffect, useEffectEvent, useRef } from 'react'
import { toast } from 'sonner'

import type { POSTV1MangaIdHistoryBody } from '@/backend/api/v1/manga/[id]/history/POST'

import { env } from '@/env/client'
import { useLatestRef } from '@/hook/useLatestRef'
import useMeQuery from '@/query/useMeQuery'
import { canAccessAdultRestrictedAPIs } from '@/utils/adult-verification'
import {
  getPendingReadingHistorySnapshotKey,
  markReadingHistorySnapshotSyncedIfUnchanged,
  readLocalReadingHistoryEntry,
  writeLocalReadingHistoryEntry,
} from '@/utils/local-reading-history'
import { upsertReadingHistoryIndexEntry } from '@/utils/reading-history-index'

import { useImageIndexStore } from './store/imageIndex'

const { NEXT_PUBLIC_BACKEND_URL } = env
const SEND_INTERVAL_MS = ms('1 minute')

type Props = {
  mangaId: number
}

type SyncContext = {
  snapshot: {
    mangaId: number
    lastPage: number
    updatedAt: number
  }
  snapshotKey: string
  userId: number
}

export default function ReadingProgressSaver({ mangaId }: Props) {
  const { data: me, isLoading } = useMeQuery()
  const canSyncToServer = Boolean(me && !isLoading && canAccessAdultRestrictedAPIs(me))
  const imageIndex = useImageIndexStore((state) => state.imageIndex)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRequestPendingRef = useRef(false)
  const lastDispatchedAtRef = useRef<number | null>(null)
  const lastDispatchedSnapshotKeyRef = useRef<string | null>(null)
  const hasStorageErrorToastShownRef = useRef(false)
  const scheduleSendRef = useLatestRef(scheduleSend)
  const queueSaveEvent = useEffectEvent(queueSave)
  const flushEvent = useEffectEvent(flush)

  function writePendingEntry(page: number, updatedAt: number) {
    const didWrite = writeLocalReadingHistoryEntry(mangaId, { lastPage: page, updatedAt, pending: true })

    if (!didWrite && !hasStorageErrorToastShownRef.current) {
      toast.warning('읽기 기록을 저장하지 못했어요')
      hasStorageErrorToastShownRef.current = true
    }
  }

  function clearTimer() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }

  function getSyncContext() {
    if (!canSyncToServer || !me) {
      return null
    }

    const entry = readLocalReadingHistoryEntry(mangaId)

    if (!entry?.pending) {
      return null
    }

    const snapshot = {
      mangaId,
      lastPage: entry.lastPage,
      updatedAt: entry.updatedAt,
    }
    const snapshotKey = getPendingReadingHistorySnapshotKey([snapshot])

    if (!snapshotKey) {
      return null
    }

    if (lastDispatchedSnapshotKeyRef.current === snapshotKey) {
      clearTimer()
      return null
    }

    return { snapshot, snapshotKey, userId: me.id }
  }

  function sendContext(context: SyncContext, options?: { keepalive?: boolean }) {
    if (isRequestPendingRef.current) {
      return
    }

    lastDispatchedAtRef.current = Date.now()
    lastDispatchedSnapshotKeyRef.current = context.snapshotKey
    clearTimer()

    const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/manga/${mangaId}/history`
    const keepalive = options?.keepalive ?? false

    const body: POSTV1MangaIdHistoryBody = {
      lastPage: context.snapshot.lastPage,
    }

    isRequestPendingRef.current = true

    fetch(url, {
      method: 'POST',
      credentials: 'include',
      keepalive,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error('Failed to save reading history')
        }

        const didMarkSynced = markReadingHistorySnapshotSyncedIfUnchanged([context.snapshot])

        if (didMarkSynced) {
          upsertReadingHistoryIndexEntry(context.userId, mangaId, context.snapshot.lastPage)
        }
      })
      .catch(() => {})
      .finally(() => {
        isRequestPendingRef.current = false
      })
  }

  function scheduleSend() {
    const context = getSyncContext()
    if (!context) {
      return
    }

    const now = Date.now()
    const lastAt = lastDispatchedAtRef.current
    const nextAt = typeof lastAt === 'number' ? lastAt + SEND_INTERVAL_MS : now
    const delayMs = Math.max(0, nextAt - now)

    if (delayMs === 0) {
      sendContext(context)
      return
    }

    if (timeoutRef.current) {
      return
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      scheduleSendRef.current()
    }, delayMs)
  }

  function queueSave(page: number) {
    const updatedAt = Date.now()

    // NOTE: 탭 단위 이어읽기를 위해 로컬 기록은 항상 최신으로 유지
    writePendingEntry(page, updatedAt)

    if (!canSyncToServer) {
      return
    }

    scheduleSend()
  }

  function flush() {
    clearTimer()

    const context = getSyncContext()
    if (!context) {
      return
    }

    sendContext(context, { keepalive: true })
  }

  // NOTE: 작품이 바뀌면(=mangaId 변경) 감상 저장 상태를 초기화해요
  useEffect(() => {
    lastDispatchedAtRef.current = null
    lastDispatchedSnapshotKeyRef.current = null
    clearTimer()
  }, [mangaId])

  // NOTE: 페이지가 바뀌면(=imageIndex 변경) 작품 감상 상태를 저장 큐에 넣어요
  useEffect(() => {
    if (imageIndex > 0) {
      queueSaveEvent(imageIndex + 1)
    }
  }, [imageIndex])

  // NOTE: 서버에 감상 상태를 저장할 수 있게 되는 순간(=로그인/성인인증 완료) 마지막 페이지를 큐에 넣어요
  useEffect(() => {
    if (!canSyncToServer) {
      return
    }

    scheduleSendRef.current()
  }, [canSyncToServer, scheduleSendRef])

  // NOTE: 뷰어를 떠날 때 마지막 작품 감상 상태를 flush하고 타이머를 정리해요
  useEffect(() => {
    return () => {
      flushEvent()
    }
  }, [])

  // NOTE: 탭/페이지가 숨김·종료되는 시점에 작품 감상 상태를 flush해요
  useEffect(() => {
    function handlePageHide() {
      flushEvent()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        flushEvent()
      }
    }

    window.addEventListener('pagehide', handlePageHide)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null
}
