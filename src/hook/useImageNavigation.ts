import { useRouter } from 'next/navigation'
import { useCallback, useEffect } from 'react'
import { toast } from 'sonner'

import { MangaIdSourceSearchParam } from '@/app/manga/[id]/common'
import { useImageIndexStore } from '@/components/ImageViewer/store/imageIndex'

type Params = {
  maxIndex: number
  offset: number
}

export default function useImageNavigation({ maxIndex, offset }: Params) {
  const { getImageIndex, setImageIndex } = useImageIndexStore()
  const router = useRouter()

  const prevPage = useCallback(() => {
    const currentImageIndex = getImageIndex()

    if (currentImageIndex <= 0) {
      toast.warning('첫번째 이미지에요')
      return
    }

    const newImageIndex = currentImageIndex - offset
    setImageIndex(newImageIndex)
    router.replace(`?${MangaIdSourceSearchParam.PAGE}=${newImageIndex + 1}`)
  }, [getImageIndex, offset, router, setImageIndex])

  const nextPage = useCallback(() => {
    const currentImageIndex = getImageIndex()

    if (currentImageIndex + offset > maxIndex) {
      toast.warning('마지막 이미지에요')
      return
    }

    const newImageIndex = currentImageIndex + offset
    setImageIndex(newImageIndex)
    router.replace(`?${MangaIdSourceSearchParam.PAGE}=${newImageIndex + 1}`)
  }, [getImageIndex, maxIndex, offset, router, setImageIndex])

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
