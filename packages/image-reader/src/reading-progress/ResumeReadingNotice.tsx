'use client'

import type { ReaderLayout, ReaderPage } from '#reader/model/readerLayout'
import type { ReaderNoticeHandle } from '#reader/model/readerNotice'

import { useReaderMessages, useReaderNoticeHandler } from '#reader/readerRuntime'
import { useReaderStore } from '#reader/state/readerStore'
import ms from 'ms'
import { useEffect, useEffectEvent, useRef } from 'react'

const DEFAULT_DURATION_MS = ms('10 seconds')

type Props = {
  lastReadablePageNumber?: number
  maxPageIndex: number
  readerLayout: ReaderLayout<ReaderPage>
}

export default function ResumeReadingNotice({ lastReadablePageNumber, maxPageIndex, readerLayout }: Props) {
  const getPageIndex = useReaderStore((state) => state.getPageIndex)
  const navigateToPageIndex = useReaderStore((state) => state.navigateToPageIndex)
  const messages = useReaderMessages()
  const onNotice = useReaderNoticeHandler()
  const hasCheckedInitialNoticeRef = useRef(false)
  const noticeHandleRef = useRef<ReaderNoticeHandle | null>(null)

  // NOTE: 토스트 액션은 누르는 순간의 최신 레이아웃으로 이동하게 해요.
  const showResumeReadingNotice = useEffectEvent((readablePageNumber: number) => {
    function handleClick() {
      const pageIndex = readerLayout.pageIndexByReadablePageNumber[readablePageNumber] ?? readablePageNumber - 1

      navigateToPageIndex(pageIndex, {
        maxIndex: maxPageIndex,
        navigationType: 'absolute',
      })
    }

    noticeHandleRef.current =
      onNotice?.({
        action: {
          label: messages.resumeReadingAction,
          onClick: handleClick,
        },
        code: 'resume-reading',
        durationMs: DEFAULT_DURATION_MS,
        id: 'reader:resume-reading',
        message: messages.resumeReadingNotice(readablePageNumber),
        severity: 'info',
      }) ?? null
  })

  // NOTE: 마지막 읽은 위치 안내는 뷰어 진입 때 한 번만 판단해요.
  useEffect(() => {
    if (hasCheckedInitialNoticeRef.current) {
      return
    }

    if (
      typeof lastReadablePageNumber !== 'number' ||
      !Number.isFinite(lastReadablePageNumber) ||
      lastReadablePageNumber < 1 ||
      readerLayout.readablePageCount <= 0
    ) {
      return
    }

    hasCheckedInitialNoticeRef.current = true

    const readablePageNumber = Math.min(Math.floor(lastReadablePageNumber), readerLayout.readablePageCount)
    const currentReadablePageNumber = readerLayout.readablePageNumberByPageIndex[getPageIndex()] ?? null

    if (readablePageNumber === currentReadablePageNumber) {
      return
    }

    showResumeReadingNotice(readablePageNumber)
  }, [getPageIndex, lastReadablePageNumber, readerLayout])

  // NOTE: 컴포넌트 언마운트 시 notice를 없애요.
  useEffect(() => {
    return () => {
      hasCheckedInitialNoticeRef.current = false
      noticeHandleRef.current?.dismiss()
      noticeHandleRef.current = null
    }
  }, [])

  return null
}
