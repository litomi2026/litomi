import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import toast from 'react-hot-toast'

type Params = {
  maxImageIndex: number
}

export default function useImageNavigation({ maxImageIndex }: Params) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)

  const setPrevIndex = useCallback(() => {
    if (currentIndex === 0) {
      toast.error('첫번째 이미지입니다.')
      return
    }

    setCurrentIndex((prev) => prev - 1)
  }, [currentIndex])

  const setNextIndex = useCallback(() => {
    if (currentIndex === maxImageIndex) {
      toast.error('마지막 이미지입니다.')
      return
    }

    setCurrentIndex((prev) => prev + 1)
  }, [currentIndex, maxImageIndex])

  useEffect(() => {
    function handleKeyDown({ code }: KeyboardEvent) {
      if (code === 'ArrowLeft') {
        setPrevIndex()
      } else if (code === 'ArrowRight') {
        setNextIndex()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [router, setNextIndex, setPrevIndex])

  return { currentIndex, setPrevIndex, setNextIndex }
}
