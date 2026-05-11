import { Loader2 } from 'lucide-react'
import { useCallback } from 'react'

import Slider from '@/components/ui/Slider'

import { useImageIndexStore } from './store/imageIndex'
import { usePageViewStore } from './store/pageView'

type Props = {
  maxImageIndex: number
}

export default function ImageSlider({ maxImageIndex }: Readonly<Props>) {
  const { imageIndex, navigateToImageIndex } = useImageIndexStore()
  const pageView = usePageViewStore((state) => state.pageView)
  const isDoublePage = pageView === 'double'
  const currentPage = imageIndex + 1
  const maxPage = maxImageIndex + 1
  const startPage = Math.max(1, currentPage)
  const endPage = isDoublePage ? Math.max(startPage, Math.min(currentPage + 1, maxPage)) : startPage
  const currentPageText = startPage === endPage ? startPage : `${startPage}-${endPage}`

  const handleValueCommit = useCallback(
    (value: number) => {
      navigateToImageIndex(value, { completionIndex: maxImageIndex, maxIndex: maxImageIndex })
    },
    [maxImageIndex, navigateToImageIndex],
  )

  return (
    <>
      <div className="px-3">
        <Slider
          aria-label="페이지 이동"
          aria-valuetext={`${currentPageText} / ${maxPage}`}
          className="h-6"
          max={maxImageIndex}
          onValueCommit={handleValueCommit}
          value={imageIndex}
        />
      </div>
      <div aria-atomic="true" aria-live="polite" className="flex justify-center gap-1 text-xs">
        <span>{currentPageText}</span>/
        {maxPage > 0 ? <span>{maxPage}</span> : <Loader2 className="size-4 animate-spin" />}
      </div>
    </>
  )
}
