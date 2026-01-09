'use client'

import ms from 'ms'
import { useCallback, useEffect, useRef } from 'react'
import { toast } from 'sonner'

import type { POSTV1MangaIdHistoryBody } from '@/backend/api/v1/manga/[id]/history/POST'

import { SessionStorageKeyMap } from '@/constants/storage'
import { env } from '@/env/client'
import { useLatestRef } from '@/hook/useLatestRef'
import useMeQuery from '@/query/useMeQuery'
import { canAccessAdultRestrictedAPIs } from '@/utils/adult-verification'

import { useImageIndexStore } from './store/imageIndex'

const { NEXT_PUBLIC_BACKEND_URL } = env

type Props = {
  mangaId: number
}

export default function ReadingProgressSaver({ mangaId }: Props) {
  const { data: me, isLoading } = useMeQuery()
  const imageIndex = useImageIndexStore((state) => state.imageIndex)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRequestPendingRef = useRef(false)
  const pendingPageRef = useRef<number | null>(null)
  const lastSyncedAtRef = useRef<number | null>(null)
  const lastSyncedPageRef = useRef<number | null>(null)
  const hasStorageErrorToastShownRef = useRef(false)

  const writeSessionStorage = useCallback(
    (page: number) => {
      try {
        sessionStorage.setItem(SessionStorageKeyMap.readingHistory(mangaId), String(page))
      } catch {
        if (!hasStorageErrorToastShownRef.current) {
          toast.warning('읽기 기록을 저장하지 못했어요')
          hasStorageErrorToastShownRef.current = true
        }
      }
    },
    [mangaId],
  )

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  const sendNowIfPossible = useCallback(
    (options?: { keepalive?: boolean }) => {
      if (!me || isLoading || isRequestPendingRef.current) {
        return
      }

      const page = pendingPageRef.current
      if (typeof page !== 'number') {
        return
      }

      if (lastSyncedPageRef.current === page) {
        clearTimer()
        return
      }

      lastSyncedAtRef.current = Date.now()
      lastSyncedPageRef.current = page
      clearTimer()

      const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/manga/${mangaId}/history`
      const keepalive = options?.keepalive ?? false

      const body: POSTV1MangaIdHistoryBody = {
        lastPage: page,
      }

      isRequestPendingRef.current = true

      fetch(url, {
        method: 'POST',
        credentials: 'include',
        keepalive,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
      })
        .catch(() => {})
        .finally(() => {
          isRequestPendingRef.current = false
        })
    },
    [me, isLoading, mangaId, clearTimer],
  )

  const scheduleSend = useCallback(() => {
    if (!me || isLoading) {
      return
    }

    const page = pendingPageRef.current
    if (typeof page !== 'number') {
      return
    }

    if (lastSyncedPageRef.current === page) {
      clearTimer()
      return
    }

    const now = Date.now()
    const lastAt = lastSyncedAtRef.current
    const nextAt = typeof lastAt === 'number' ? lastAt + ms('1 minute') : now
    const delayMs = Math.max(0, nextAt - now)

    if (delayMs === 0) {
      sendNowIfPossible()
      return
    }

    if (timeoutRef.current) {
      return
    }

    timeoutRef.current = setTimeout(() => {
      timeoutRef.current = null
      sendNowIfPossible()
    }, delayMs)
  }, [me, isLoading, sendNowIfPossible, clearTimer])

  const queueSave = useCallback(
    (page: number) => {
      // NOTE: 탭 단위 이어읽기를 위해 로컬 기록은 항상 최신으로 유지
      writeSessionStorage(page)

      if (isLoading || !me || !canAccessAdultRestrictedAPIs(me)) {
        return
      }

      pendingPageRef.current = page
      scheduleSend()
    },
    [writeSessionStorage, isLoading, me, scheduleSend],
  )

  const flush = useCallback(() => {
    clearTimer()
    sendNowIfPossible({ keepalive: true })
  }, [clearTimer, sendNowIfPossible])

  const flushRef = useLatestRef(flush)

  // NOTE: 페이지가 바뀌면 작품 감상 상태를 저장 큐에 넣어요
  useEffect(() => {
    if (imageIndex > 0) {
      queueSave(imageIndex + 1)
    }
  }, [imageIndex, queueSave])

  // NOTE: 뷰어를 떠날 때 마지막 작품 감상 상태를 flush하고 타이머를 정리해요
  useEffect(() => {
    return () => {
      flush()
      clearTimer()
    }
  }, [flush, clearTimer])

  // NOTE: 탭/페이지가 숨김·종료되는 시점에 작품 감상 상태를 flush해요
  useEffect(() => {
    function handlePageHide() {
      flushRef.current()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        flushRef.current()
      }
    }

    window.addEventListener('pagehide', handlePageHide)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', handlePageHide)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [flushRef])

  return null
}
