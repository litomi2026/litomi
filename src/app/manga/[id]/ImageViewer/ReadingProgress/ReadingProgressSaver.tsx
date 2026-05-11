'use client'

import { useQueryClient } from '@tanstack/react-query'
import ms from 'ms'
import { useEffect, useEffectEvent, useRef } from 'react'

import type { POSTV1MangaIdHistoryBody } from '@/backend/api/v1/manga/[id]/history/POST'

import { QueryKeys } from '@/constants/query'
import { env } from '@/env/client'
import useMeQuery from '@/query/useMeQuery'
import { getAdultState, hasAdultAccess } from '@/utils/adult-verification'
import { setLocalReadingHistoryEntry } from '@/utils/reading-history-index'

import { usePageNavigationStore } from '../store/pageNavigation'

const { NEXT_PUBLIC_API_ORIGIN } = env
const SEND_INTERVAL_MS = ms('1 minute')

type Props = {
  imageCount: number
  mangaId: number
}

export default function ReadingProgressSaver({ imageCount, mangaId }: Props) {
  const { data: me } = useMeQuery()
  const adultState = getAdultState(me)
  const canSyncReadingProgress = hasAdultAccess(adultState) && me?.settings.historySyncEnabled === true
  const pageIndex = usePageNavigationStore((state) => state.pageIndex)
  const isRequestPendingRef = useRef(false)
  const queryClient = useQueryClient()

  const sendCurrentPage = useEffectEvent((options?: { keepalive?: boolean }) => {
    if (!canSyncReadingProgress || isRequestPendingRef.current || pageIndex <= 0 || imageCount <= 0) {
      return
    }

    const url = `${NEXT_PUBLIC_API_ORIGIN}/api/v1/manga/${mangaId}/history`
    const lastReadablePage = Math.min(pageIndex + 1, imageCount)

    const body: POSTV1MangaIdHistoryBody = {
      lastPage: lastReadablePage,
    }

    isRequestPendingRef.current = true

    fetch(url, {
      method: 'POST',
      credentials: 'include',
      keepalive: options?.keepalive,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
      .catch(() => {})
      .finally(() => {
        isRequestPendingRef.current = false
      })
  })

  const flush = useEffectEvent(() => {
    sendCurrentPage({ keepalive: true })
  })

  // NOTE: 로컬 기록은 항상 최신으로 유지해요.
  useEffect(() => {
    if (pageIndex <= 0 || imageCount <= 0) {
      return
    }

    setLocalReadingHistoryEntry(mangaId, Math.min(pageIndex + 1, imageCount))

    queryClient.invalidateQueries({ queryKey: QueryKeys.localReadingHistorySummary })
    queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteReadingHistory('local') })
  }, [imageCount, mangaId, pageIndex, queryClient])

  // NOTE: 감상 기록 자동 저장이 켜져 있으면 1분마다 최신 페이지를 서버에 보내요.
  useEffect(() => {
    if (!canSyncReadingProgress) {
      return
    }

    const intervalId = setInterval(() => {
      sendCurrentPage()
    }, SEND_INTERVAL_MS)

    return () => {
      clearInterval(intervalId)
    }
  }, [canSyncReadingProgress])

  // NOTE: 탭/페이지가 숨김·종료되거나 뷰어를 떠나는 시점에 마지막 감상 상태를 보내요.
  useEffect(() => {
    function handlePageHide() {
      flush()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        flush()
      }
    }

    window.addEventListener('pagehide', handlePageHide)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      flush()
      window.removeEventListener('pagehide', handlePageHide)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return null
}
