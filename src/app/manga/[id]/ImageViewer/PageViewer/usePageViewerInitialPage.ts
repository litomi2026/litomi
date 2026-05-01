import { useEffect } from 'react'

import { MangaIdSearchParam } from '../../common'
import { useImageIndexStore } from '../store/imageIndex'

type Params = {
  imageCount: number
}

export default function usePageViewerInitialPage({ imageCount }: Params) {
  const setImageIndex = useImageIndexStore((state) => state.setImageIndex)

  // NOTE: page 파라미터가 있으면 초기 페이지를 변경함
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const pageStr = params.get(MangaIdSearchParam.PAGE) ?? ''
    const parsedPage = parseInt(pageStr, 10)

    if (isNaN(parsedPage)) {
      return
    }

    setImageIndex(Math.max(0, Math.min(parsedPage - 1, imageCount)))
  }, [imageCount, setImageIndex])
}
