'use client'

import ms from 'ms'
import { useEffect, useEffectEvent, useRef } from 'react'

import type { ReaderLayout, ReaderPage } from '../model/readerLayout'

import { useReaderStore } from '../state/readerStore'

const DEFAULT_SAVE_INTERVAL_MS = ms('1 minute')

export type ReadingProgress = {
  pageIndex: number
  readablePageCount: number
  readablePageNumber: number
}

export type ReadingProgressSaveOptions = {
  keepalive?: boolean
}

type Props = {
  onChange: (progress: ReadingProgress) => void
  onSave?: (progress: ReadingProgress, options?: ReadingProgressSaveOptions) => Promise<void> | void
  readerLayout: ReaderLayout<ReaderPage>
}

export default function ReadingProgressTracker({ onChange, onSave, readerLayout }: Props) {
  const pageIndex = useReaderStore((state) => state.pageIndex)
  const isSavePendingRef = useRef(false)

  const canSave = Boolean(onSave)
  const readablePageCount = readerLayout.readablePageCount
  const readablePageNumber = readerLayout.readablePageNumberByPageIndex[pageIndex] ?? null

  const emitProgressChange = useEffectEvent((progress: ReadingProgress) => onChange(progress))

  const saveCurrentProgress = useEffectEvent((options?: ReadingProgressSaveOptions) => {
    if (!onSave || isSavePendingRef.current || !readablePageNumber || readablePageCount <= 0) {
      return
    }

    const progress: ReadingProgress = {
      pageIndex,
      readablePageCount,
      readablePageNumber: Math.min(readablePageNumber, readablePageCount),
    }

    isSavePendingRef.current = true

    Promise.resolve(onSave(progress, options))
      .catch(() => {})
      .finally(() => {
        isSavePendingRef.current = false
      })
  })

  // NOTE: 로컬 기록은 항상 최신으로 유지해요.
  useEffect(() => {
    if (!readablePageNumber || readablePageCount <= 0) {
      return
    }

    emitProgressChange({
      pageIndex,
      readablePageCount,
      readablePageNumber: Math.min(readablePageNumber, readablePageCount),
    })
  }, [pageIndex, readablePageCount, readablePageNumber])

  // NOTE: 감상 기록 자동 저장이 켜져 있으면 1분마다 최신 페이지를 서버에 보내요.
  useEffect(() => {
    if (!canSave) {
      return
    }

    const intervalId = window.setInterval(() => {
      saveCurrentProgress()
    }, DEFAULT_SAVE_INTERVAL_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [canSave])

  // NOTE: 탭/페이지가 숨김·종료되거나 뷰어를 떠나는 시점에 마지막 감상 상태를 보내요.
  useEffect(() => {
    if (!canSave) {
      return
    }

    function handlePageHide() {
      saveCurrentProgress({ keepalive: true })
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        saveCurrentProgress({ keepalive: true })
      }
    }

    window.addEventListener('pagehide', handlePageHide)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      saveCurrentProgress({ keepalive: true })
      window.removeEventListener('pagehide', handlePageHide)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [canSave])

  return null
}
