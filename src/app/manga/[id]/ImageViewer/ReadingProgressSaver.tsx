'use client'

import ms from 'ms'
import { useEffect, useEffectEvent, useRef } from 'react'
import { toast } from 'sonner'

import type { POSTV1MangaIdHistoryBody } from '@/backend/api/v1/manga/[id]/history/POST'

import { GETV1MeResponse } from '@/backend/api/v1/me'
import { SessionStorageKeyMap } from '@/constants/storage'
import { env } from '@/env/client'
import { useLatestRef } from '@/hook/useLatestRef'
import useMeQuery from '@/query/useMeQuery'
import { canAccessAdultRestrictedAPIs } from '@/utils/adult-verification'
import { upsertReadingHistoryIndexEntry } from '@/utils/reading-history-index'

import { useImageIndexStore } from './store/imageIndex'

const { NEXT_PUBLIC_BACKEND_URL } = env
const SEND_INTERVAL_MS = ms('1 minute')

type Props = {
  mangaId: number
}

type SyncContext = {
  me: GETV1MeResponse
  page: number
}

export default function ReadingProgressSaver({ mangaId }: Props) {
  const { data: me, isLoading } = useMeQuery()
  const canSyncToServer = Boolean(me && !isLoading && canAccessAdultRestrictedAPIs(me))
  const imageIndex = useImageIndexStore((state) => state.imageIndex)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isRequestPendingRef = useRef(false)
  const latestPageRef = useRef<number | null>(null)
  const pendingPageRef = useRef<number | null>(null)
  const lastSyncedAtRef = useRef<number | null>(null)
  const lastSyncedPageRef = useRef<number | null>(null)
  const hasStorageErrorToastShownRef = useRef(false)
  const scheduleSendRef = useLatestRef(scheduleSend)
  const queueSaveEvent = useEffectEvent(queueSave)
  const flushEvent = useEffectEvent(flush)

  function writeSessionStorage(page: number) {
    try {
      sessionStorage.setItem(SessionStorageKeyMap.readingHistory(mangaId), String(page))
    } catch {
      if (!hasStorageErrorToastShownRef.current) {
        toast.warning('읽기 기록을 저장하지 못했어요')
        hasStorageErrorToastShownRef.current = true
      }
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

    const page = pendingPageRef.current
    if (page === null) {
      return null
    }

    if (lastSyncedPageRef.current === page) {
      clearTimer()
      return null
    }

    return { me, page }
  }

  function sendContext(context: SyncContext, options?: { keepalive?: boolean }) {
    if (isRequestPendingRef.current) {
      return
    }

    lastSyncedAtRef.current = Date.now()
    lastSyncedPageRef.current = context.page
    clearTimer()

    // NOTE: 뷰어 재진입 시 서버 호출 없이도 이어읽기가 가능하도록 최신 페이지를 인덱스에 반영해요
    upsertReadingHistoryIndexEntry(context.me.id, mangaId, context.page)

    const url = `${NEXT_PUBLIC_BACKEND_URL}/api/v1/manga/${mangaId}/history`
    const keepalive = options?.keepalive ?? false

    const body: POSTV1MangaIdHistoryBody = {
      lastPage: context.page,
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
  }

  function scheduleSend() {
    const context = getSyncContext()
    if (!context) {
      return
    }

    const now = Date.now()
    const lastAt = lastSyncedAtRef.current
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
    // NOTE: 탭 단위 이어읽기를 위해 로컬 기록은 항상 최신으로 유지
    writeSessionStorage(page)
    latestPageRef.current = page

    if (!canSyncToServer) {
      return
    }

    pendingPageRef.current = page
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
    pendingPageRef.current = null
    latestPageRef.current = null
    lastSyncedAtRef.current = null
    lastSyncedPageRef.current = null
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

    const page = latestPageRef.current
    if (page === null) {
      return
    }

    pendingPageRef.current = page
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
