import { useImageIndexStore } from '@/components/ImageViewer/store/imageIndex'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'

type Params = {
  maxIndex: number
  offset: number
}

export default function useImageNavigation({ maxIndex, offset }: Params) {
  const { imageIndex, setImageIndex } = useImageIndexStore()

  const prevPage = useCallback(() => {
    if (imageIndex <= 0) {
      toast.warning('첫번째 이미지입니다.')
      return
    }

    setImageIndex(imageIndex - offset)
  }, [imageIndex, offset, setImageIndex])

  const nextPage = useCallback(() => {
    if (imageIndex + offset > maxIndex) {
      toast.warning('마지막 이미지입니다.')
      return
    }

    setImageIndex(imageIndex + offset)
  }, [imageIndex, maxIndex, offset, setImageIndex])

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

  return { prevPage, nextPage }
}
