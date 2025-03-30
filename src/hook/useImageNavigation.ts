import { useImageIndexStore } from '@/components/ImageViewer/store/imageIndex'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'

type Params = {
  maxIndex: number
  offset: number
}

export default function useImageNavigation({ maxIndex, offset }: Params) {
  const { getImageIndex, setImageIndex } = useImageIndexStore()

  const prevPage = useCallback(() => {
    const currentImageIndex = getImageIndex()

    if (currentImageIndex <= 0) {
      toast.warning('첫번째 이미지입니다.')
      return
    }

    setImageIndex(currentImageIndex - offset)
  }, [getImageIndex, offset, setImageIndex])

  const nextPage = useCallback(() => {
    const currentImageIndex = getImageIndex()

    if (currentImageIndex + offset > maxIndex) {
      toast.warning('마지막 이미지입니다.')
      return
    }

    setImageIndex(currentImageIndex + offset)
  }, [getImageIndex, maxIndex, offset, setImageIndex])

  useEffect(() => {
    function handleKeyDown({ code, metaKey }: KeyboardEvent) {
      if (code === 'ArrowLeft' && !metaKey) {
        prevPage()
      } else if (code === 'ArrowRight' && !metaKey) {
        nextPage()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [nextPage, prevPage])

  return { prevPage, nextPage }
}
