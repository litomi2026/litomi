import { memo, useCallback } from 'react'

import IconSpinner from '@/components/icons/IconSpinner'
import Slider from '@/components/ui/Slider'

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
  const scrollToRow = useVirtualScrollStore((state) => state.scrollToRow)
  const isDoublePage = pageView === 'double'
  const currentPage = imageIndex + 1
  const maxPage = maxImageIndex + 1
  const startPage = Math.max(1, currentPage)
  const endPage = isDoublePage ? Math.max(startPage, Math.min(currentPage + 1, maxPage)) : startPage

  const handleValueCommit = useCallback(
    (value: number) => {
      navigateToImageIndex(value)
      scrollToRow(isDoublePage ? Math.floor(value / 2) : value)
    },
    [isDoublePage, navigateToImageIndex, scrollToRow],
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
