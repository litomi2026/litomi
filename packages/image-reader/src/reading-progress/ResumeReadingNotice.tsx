'use client'

import type { ReaderLayout, ReaderPage } from '#reader/model/readerLayout'

import { useReaderMessages, useReaderNotice } from '#reader/readerRuntime'
import { useReaderStore } from '#reader/state/readerStore'
import ms from 'ms'
import { useEffect } from 'react'

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
  const notify = useReaderNotice()

  useEffect(() => {
    const currentReadablePageNumber = readerLayout.readablePageNumberByPageIndex[getPageIndex()] ?? 0

    if (
      typeof lastReadablePageNumber !== 'number' ||
      lastReadablePageNumber === currentReadablePageNumber ||
      lastReadablePageNumber === readerLayout.readablePageCount
    ) {
      return
    }

    const notice = notify({
      action: {
        label: messages.resumeReadingAction,
        onClick: () => {
          const pageIndex =
            readerLayout.pageIndexByReadablePageNumber[lastReadablePageNumber] ?? lastReadablePageNumber - 1

          navigateToPageIndex(pageIndex, {
            maxIndex: maxPageIndex,
            scrollRowIndex: readerLayout.spreadIndexByPageIndex[pageIndex] ?? pageIndex,
          })
        },
      },
      code: 'resume-reading',
      durationMs: DEFAULT_DURATION_MS,
      id: 'reader:resume-reading',
      message: messages.resumeReadingNotice(lastReadablePageNumber),
      severity: 'info',
    })

    return () => {
      notice.dismiss()
    }
  }, [getPageIndex, lastReadablePageNumber, maxPageIndex, messages, navigateToPageIndex, notify, readerLayout])

  return null
}
