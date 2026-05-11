import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'

import { usePageNavigationStore } from '../store/pageNavigation'
import { shouldIgnoreViewerGestureTarget } from '../viewerGesturePolicy'

const PREV_PAGE_CODES = new Set(['ArrowLeft', 'AudioVolumeUp', 'PageUp'])
const NEXT_PAGE_CODES = new Set(['ArrowRight', 'AudioVolumeDown', 'PageDown'])
const PREV_PAGE_KEYS = new Set(['AudioVolumeUp', 'VolumeUp'])
const NEXT_PAGE_KEYS = new Set(['AudioVolumeDown', 'VolumeDown'])

type Params = {
  maxIndex: number
  offset: number
}

export default function usePageNavigation({ maxIndex, offset }: Params) {
  const { getPageIndex, navigateToPageIndex } = usePageNavigationStore()

  const prevPage = useCallback(() => {
    const currentPageIndex = getPageIndex()
    const prevPageIndex = Math.max(0, currentPageIndex - offset)

    const isSameVisiblePageGroup =
      prevPageIndex === currentPageIndex ||
      (offset > 1 && Math.floor(prevPageIndex / offset) === Math.floor(currentPageIndex / offset))

    if (isSameVisiblePageGroup) {
      toast.warning('첫번째 페이지예요')
      return
    }

    navigateToPageIndex(prevPageIndex, { maxIndex })
  }, [getPageIndex, maxIndex, offset, navigateToPageIndex])

  const nextPage = useCallback(() => {
    const currentPageIndex = getPageIndex()
    const nextPageIndex = Math.min(currentPageIndex + offset, maxIndex)

    const isSameVisiblePageGroup =
      nextPageIndex === currentPageIndex ||
      (offset > 1 && Math.floor(nextPageIndex / offset) === Math.floor(currentPageIndex / offset))

    if (isSameVisiblePageGroup) {
      toast.warning('마지막 페이지예요')
      return
    }

    navigateToPageIndex(nextPageIndex, { maxIndex })
  }, [getPageIndex, maxIndex, offset, navigateToPageIndex])

  const firstPage = useCallback(() => {
    const currentPageIndex = getPageIndex()

    if (currentPageIndex === 0) {
      toast.warning('첫번째 페이지예요')
      return
    }

    navigateToPageIndex(0, { maxIndex })
  }, [getPageIndex, maxIndex, navigateToPageIndex])

  const lastPage = useCallback(() => {
    const currentPageIndex = getPageIndex()

    if (currentPageIndex === maxIndex) {
      toast.warning('마지막 페이지예요')
      return
    }

    navigateToPageIndex(maxIndex, { maxIndex })
  }, [getPageIndex, maxIndex, navigateToPageIndex])

  // NOTE: 키보드 이벤트 핸들러
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
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
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [nextPage, prevPage, firstPage, lastPage])

  return { prevPage, nextPage }
}
