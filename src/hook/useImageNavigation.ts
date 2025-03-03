import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

type Params = {
  maxIndex: number
  offset: number
}

export default function useImageNavigation({ maxIndex, offset }: Params) {
  const [currentIndex, setCurrentIndex] = useState(0)

  const prevPage = useCallback(() => {
    if (currentIndex <= 0) {
      toast('첫번째 이미지입니다.', { icon: '⚠️' })
      return
    }

    setCurrentIndex((prev) => prev - offset)
  }, [currentIndex, offset])

  const nextPage = useCallback(() => {
    if (currentIndex + offset > maxIndex) {
      toast('마지막 이미지입니다.', { icon: '⚠️' })
      return
    }

    setCurrentIndex((prev) => prev + offset)
  }, [currentIndex, maxIndex, offset])

  useEffect(() => {
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
  }, [nextPage, prevPage])

  return { currentIndex, prevPage, nextPage }
}
