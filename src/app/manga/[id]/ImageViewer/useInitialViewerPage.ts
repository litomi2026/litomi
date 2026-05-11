import { useEffect } from 'react'

import { MangaIdSearchParam } from '../common'
import { usePageNavigationStore } from './store/pageNavigation'

type Params = {
  maxIndex: number
}

export default function useInitialViewerPage({ maxIndex }: Params) {
  const navigateToPageIndex = usePageNavigationStore((state) => state.navigateToPageIndex)

  // NOTE: page 파라미터가 있으면 모든 뷰어 모드에서 같은 navigation 경로로 초기 위치를 복원해요.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const pageStr = params.get(MangaIdSearchParam.PAGE) ?? ''
    const parsedPage = parseInt(pageStr, 10)

    if (isNaN(parsedPage)) {
      return
    }

    navigateToPageIndex(parsedPage - 1, { maxIndex })
  }, [maxIndex, navigateToPageIndex])
}
