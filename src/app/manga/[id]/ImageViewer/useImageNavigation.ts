import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'

import { useImageIndexStore } from './store/imageIndex'

const PREV_PAGE_CODES = new Set(['ArrowLeft', 'AudioVolumeUp', 'PageUp'])
const NEXT_PAGE_CODES = new Set(['ArrowRight', 'AudioVolumeDown', 'PageDown'])
const PREV_PAGE_KEYS = new Set(['AudioVolumeUp', 'VolumeUp'])
const NEXT_PAGE_KEYS = new Set(['AudioVolumeDown', 'VolumeDown'])

type Params = {
  maxIndex: number
  offset: number
}

export default function useImageNavigation({ maxIndex, offset }: Params) {
  const { getImageIndex, navigateToImageIndex } = useImageIndexStore()

  const prevPage = useCallback(() => {
    const currentImageIndex = getImageIndex()
    const prevImageIndex = Math.max(0, currentImageIndex - offset)

    if (currentImageIndex === 0 && prevImageIndex === 0) {
      toast.warning('첫번째 페이지예요')
      return
    }

    navigateToImageIndex(prevImageIndex)
  }, [getImageIndex, offset, navigateToImageIndex])

  const nextPage = useCallback(() => {
    const currentImageIndex = getImageIndex()
    const nextImageIndex = Math.min(currentImageIndex + offset, maxIndex)

    if (currentImageIndex === maxIndex && nextImageIndex === maxIndex) {
      toast.warning('마지막 페이지예요')
      return
    }

    navigateToImageIndex(nextImageIndex)
  }, [getImageIndex, maxIndex, offset, navigateToImageIndex])

  const firstPage = useCallback(() => {
    const currentImageIndex = getImageIndex()

    if (currentImageIndex === 0) {
      toast.warning('첫번째 페이지예요')
      return
    }

    navigateToImageIndex(0)
  }, [getImageIndex, navigateToImageIndex])

  const lastPage = useCallback(() => {
    const currentImageIndex = getImageIndex()

    if (currentImageIndex === maxIndex) {
      toast.warning('마지막 페이지예요')
      return
    }

    navigateToImageIndex(maxIndex)
  }, [getImageIndex, maxIndex, navigateToImageIndex])

  // NOTE: 키보드 이벤트 핸들러
  useEffect(() => {
    function handleKeyDown({ code, key, metaKey }: KeyboardEvent) {
      if (metaKey && (code === 'ArrowLeft' || code === 'ArrowRight')) {
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
