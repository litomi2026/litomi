import { memo, useCallback } from 'react'

import IconSpinner from '../icons/IconSpinner'
import Slider from '../ui/Slider'
import { useImageIndexStore } from './store/imageIndex'
import { usePageViewStore } from './store/pageView'
import { useVirtualScrollStore } from './store/virtualizer'

type Props = {
  maxImageIndex: number
}

export default memo(ImageSlider)

function ImageSlider({ maxImageIndex }: Readonly<Props>) {
  const { imageIndex, navigateToImageIndex } = useImageIndexStore()
  const pageView = usePageViewStore((state) => state.pageView)
  const getListRef = useVirtualScrollStore((state) => state.getListRef)
  const isDoublePage = pageView === 'double'
  const currentPage = imageIndex + 1
  const maxPage = maxImageIndex + 1
  const startPage = Math.max(1, currentPage)
  const endPage = isDoublePage ? Math.min(currentPage + 1, maxPage) : startPage

  const handleValueCommit = useCallback(
    (value: number) => {
      navigateToImageIndex(value)
      getListRef()?.current?.scrollToRow({ index: isDoublePage ? Math.floor(value / 2) : value, align: 'start' })
    },
    [getListRef, isDoublePage, navigateToImageIndex],
  )

  return (
    <>
      <div className="px-3">
        <Slider className="h-6" max={maxImageIndex} onValueCommit={handleValueCommit} value={imageIndex} />
      </div>
      <div className="flex justify-center gap-1 text-xs">
        <span>{startPage === endPage ? startPage : `${startPage}-${endPage}`}</span>/
        {maxPage > 0 ? <span>{maxPage}</span> : <IconSpinner className="size-4" />}
      </div>
    </>
  )
}
