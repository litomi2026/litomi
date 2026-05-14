import { useEffect, useEffectEvent } from 'react'
import { toast } from 'sonner'

import type { ReaderLayout, ReaderPage } from '../readerPages'

import { useReaderStore } from '../store/reader'
import { shouldIgnoreViewerGestureTarget } from '../viewerGesturePolicy'

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

  function prevPage() {
    const currentPageIndex = getPageIndex()
    const currentSpreadIndex = readerLayout.spreadIndexByPageIndex[currentPageIndex] ?? 0
    const prevSpread = readerLayout.spreads[currentSpreadIndex - 1]

    if (!prevSpread) {
      toast.warning('첫번째 페이지예요')
      return
    }

    navigateToPageIndex(prevSpread.startPageIndex, { maxIndex: maxPageIndex })
  }

  function nextPage() {
    const currentPageIndex = getPageIndex()
    const currentSpreadIndex = readerLayout.spreadIndexByPageIndex[currentPageIndex] ?? 0
    const nextSpread = readerLayout.spreads[currentSpreadIndex + 1]

    if (!nextSpread) {
      toast.warning('마지막 페이지예요')
      return
    }

    navigateToPageIndex(nextSpread.startPageIndex, { maxIndex: maxPageIndex })
  }

  function firstPage() {
    const currentPageIndex = getPageIndex()
    const firstSpread = readerLayout.spreads[0]

    if (!firstSpread || readerLayout.spreadIndexByPageIndex[currentPageIndex] === 0) {
      toast.warning('첫번째 페이지예요')
      return
    }

    navigateToPageIndex(firstSpread.startPageIndex, { maxIndex: maxPageIndex })
  }

  function lastPage() {
    const currentPageIndex = getPageIndex()
    const lastSpreadIndex = readerLayout.spreads.length - 1
    const lastSpread = readerLayout.spreads[lastSpreadIndex]

    if (!lastSpread || readerLayout.spreadIndexByPageIndex[currentPageIndex] === lastSpreadIndex) {
      toast.warning('마지막 페이지예요')
      return
    }

    navigateToPageIndex(lastSpread.startPageIndex, { maxIndex: maxPageIndex })
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
