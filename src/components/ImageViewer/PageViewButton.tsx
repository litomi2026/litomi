import { memo } from 'react'

import { useImageIndexStore } from './store/imageIndex'
import { usePageViewStore } from './store/pageView'

export default memo(PageViewButton)

function PageViewButton() {
  const correctImageIndex = useImageIndexStore((state) => state.correctImageIndex)
  const { pageView, setPageView } = usePageViewStore()
  const isDoublePage = pageView === 'double'

  return (
    <button
      onClick={() => {
        correctImageIndex()
        setPageView(isDoublePage ? 'single' : 'double')
      }}
    >
      {isDoublePage ? '두 쪽' : '한 쪽'} 보기
    </button>
  )
}
