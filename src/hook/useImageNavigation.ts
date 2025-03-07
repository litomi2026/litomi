import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

type Params = {
  maxIndex: number
  offset: number
  enabled: boolean
}

export default function useImageNavigation({ maxIndex, offset, enabled }: Params) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const prevPage = useCallback(() => {
    if (!enabled) return

    if (currentIndex <= 0) {
      toast.warning('첫번째 이미지입니다.')
      return
    }

    setCurrentIndex((prev) => prev - offset)
  }, [currentIndex, enabled, offset])

  const nextPage = useCallback(() => {
    if (!enabled) return

    if (currentIndex + offset > maxIndex) {
      toast.warning('마지막 이미지입니다.')
      return
    }

    setCurrentIndex((prev) => prev + offset)
  }, [currentIndex, enabled, maxIndex, offset])

  useEffect(() => {
    if (!enabled) return

    function handleKeyDown({ code }: KeyboardEvent) {
      if (code === 'ArrowLeft') {
        prevPage()
      } else if (code === 'ArrowRight') {
        nextPage()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [enabled, nextPage, prevPage])

  return { currentIndex, setCurrentIndex, prevPage, nextPage }
}
