'use client'

import type { ReaderLayout, ReaderPage } from '#reader/model/readerLayout'

import { useReaderStore } from '#reader/state/readerStore'
import ms from 'ms'
import { useEffect } from 'react'
import { toast } from 'sonner'

const DEFAULT_DURATION_MS = ms('10 seconds')

type Props = {
  lastReadablePageNumber?: number
  maxPageIndex: number
  readerLayout: ReaderLayout<ReaderPage>
}

export default function ResumeReadingToast({ lastReadablePageNumber, maxPageIndex, readerLayout }: Props) {
  const getPageIndex = useReaderStore((state) => state.getPageIndex)
  const navigateToPageIndex = useReaderStore((state) => state.navigateToPageIndex)

  useEffect(() => {
    const currentReadablePageNumber = readerLayout.readablePageNumberByPageIndex[getPageIndex()] ?? 0

    if (
      typeof lastReadablePageNumber !== 'number' ||
      lastReadablePageNumber === currentReadablePageNumber ||
      lastReadablePageNumber === readerLayout.readablePageCount
    ) {
      return
    }

    const toastId = toast(`마지막으로 읽던 페이지 ${lastReadablePageNumber}`, {
      duration: DEFAULT_DURATION_MS,
      action: {
        label: '이동',
        onClick: () => {
          const pageIndex =
            readerLayout.pageIndexByReadablePageNumber[lastReadablePageNumber] ?? lastReadablePageNumber - 1

          navigateToPageIndex(pageIndex, {
            maxIndex: maxPageIndex,
            scrollRowIndex: readerLayout.spreadIndexByPageIndex[pageIndex] ?? pageIndex,
          })
        },
      },
    })

    return () => {
      toast.dismiss(toastId)
    }
  }, [getPageIndex, lastReadablePageNumber, maxPageIndex, navigateToPageIndex, readerLayout])

  return null
}
