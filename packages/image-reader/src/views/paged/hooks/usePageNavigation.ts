import { useEffect, useEffectEvent } from 'react'

import { useReaderMessages, useReaderNoticeHandler } from '#reader/context'
import type { ReaderLayout, ReaderPage } from '#reader/model/readerLayout'
import { shouldIgnoreViewerGestureTarget } from '#reader/model/viewerGesturePolicy'
import { useReaderStore } from '#reader/state/readerStore'

const PREV_PAGE_CODES = new Set(['ArrowLeft', 'AudioVolumeUp', 'PageUp'])
const NEXT_PAGE_CODES = new Set(['ArrowRight', 'AudioVolumeDown', 'PageDown'])
const PREV_PAGE_KEYS = new Set(['AudioVolumeUp', 'VolumeUp'])
const NEXT_PAGE_KEYS = new Set(['AudioVolumeDown', 'VolumeDown'])

type Params<TPage extends ReaderPage> = {
  maxPageIndex: number
  readerLayout: ReaderLayout<TPage>
}

export default function usePageNavigation<TPage extends ReaderPage>({ maxPageIndex, readerLayout }: Params<TPage>) {
  const getPageIndex = useReaderStore((state) => state.getPageIndex)
  const navigateToPageIndex = useReaderStore((state) => state.navigateToPageIndex)
  const messages = useReaderMessages()
  const onNotice = useReaderNoticeHandler()

  function prevPage() {
    const currentPageIndex = getPageIndex()
    const currentSpreadIndex = readerLayout.spreadIndexByPageIndex[currentPageIndex] ?? 0
    const prevSpread = readerLayout.spreads[currentSpreadIndex - 1]

    if (!prevSpread) {
      onNotice?.({
        code: 'first-page',
        id: 'reader:first-page',
        message: messages.firstPageNotice,
        severity: 'warning',
      })
      return
    }

    navigateToPageIndex(prevSpread.startPageIndex, {
      maxIndex: maxPageIndex,
      navigationType: 'relative',
    })
  }

  function nextPage() {
    const currentPageIndex = getPageIndex()
    const currentSpreadIndex = readerLayout.spreadIndexByPageIndex[currentPageIndex] ?? 0
    const nextSpread = readerLayout.spreads[currentSpreadIndex + 1]

    if (!nextSpread) {
      onNotice?.({
        code: 'last-page',
        id: 'reader:last-page',
        message: messages.lastPageNotice,
        severity: 'warning',
      })
      return
    }

    navigateToPageIndex(nextSpread.startPageIndex, {
      maxIndex: maxPageIndex,
      navigationType: 'relative',
    })
  }

  function firstPage() {
    if (getPageIndex() === 0) {
      onNotice?.({
        code: 'first-page',
        id: 'reader:first-page',
        message: messages.firstPageNotice,
        severity: 'warning',
      })
      return
    }

    navigateToPageIndex(0, {
      maxIndex: maxPageIndex,
      navigationType: 'absolute',
    })
  }

  function lastPage() {
    if (getPageIndex() === maxPageIndex) {
      onNotice?.({
        code: 'last-page',
        id: 'reader:last-page',
        message: messages.lastPageNotice,
        severity: 'warning',
      })
      return
    }

    navigateToPageIndex(maxPageIndex, {
      maxIndex: maxPageIndex,
      navigationType: 'absolute',
    })
  }

  const handleKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const { altKey, code, ctrlKey, defaultPrevented, key, metaKey, target } = event

    if (defaultPrevented || altKey || ctrlKey || metaKey || shouldIgnoreViewerGestureTarget(target)) {
      return
    }

    if (PREV_PAGE_CODES.has(code) || PREV_PAGE_KEYS.has(key)) {
      prevPage()
    } else if (NEXT_PAGE_CODES.has(code) || NEXT_PAGE_KEYS.has(key)) {
      nextPage()
    } else if (code === 'Home') {
      firstPage()
    } else if (code === 'End') {
      lastPage()
    }
  })

  // NOTE: 키보드 이벤트 핸들러
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return { prevPage, nextPage }
}
