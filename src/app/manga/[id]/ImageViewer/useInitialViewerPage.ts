import { useEffect } from 'react'

import { MangaIdSearchParam } from '../common'
import { useImageIndexStore } from './store/imageIndex'

type Params = {
  maxIndex: number
}

export default function useInitialViewerPage({ maxIndex }: Params) {
  const navigateToImageIndex = useImageIndexStore((state) => state.navigateToImageIndex)

  // NOTE: page 파라미터가 있으면 모든 뷰어 모드에서 같은 navigation 경로로 초기 위치를 복원해요.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const pageStr = params.get(MangaIdSearchParam.PAGE) ?? ''
    const parsedPage = parseInt(pageStr, 10)

    if (isNaN(parsedPage)) {
      return
    }

    navigateToImageIndex(parsedPage - 1, {
      completionIndex: maxIndex,
      maxIndex,
    })
  }, [maxIndex, navigateToImageIndex])
}
