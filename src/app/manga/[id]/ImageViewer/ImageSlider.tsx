import { Loader2 } from 'lucide-react'
import { useCallback } from 'react'

import Slider from '@/components/ui/Slider'

import { usePageNavigationStore } from './store/pageNavigation'
import { usePageViewStore } from './store/pageView'

type Props = {
  maxPageIndex: number
}

export default function ImageSlider({ maxPageIndex }: Readonly<Props>) {
  const { navigateToPageIndex, pageIndex } = usePageNavigationStore()
  const pageView = usePageViewStore((state) => state.pageView)
  const isDoublePage = pageView === 'double'
  const visibleStartPageIndex = isDoublePage ? Math.floor(pageIndex / 2) * 2 : pageIndex
  const currentPage = visibleStartPageIndex + 1
  const maxPage = maxPageIndex + 1
  const startPage = Math.max(1, currentPage)
  const endPage = isDoublePage ? Math.max(startPage, Math.min(currentPage + 1, maxPage)) : startPage
  const currentPageText = startPage === endPage ? startPage : `${startPage}-${endPage}`

  const handleValueCommit = useCallback(
    (value: number) => {
      navigateToPageIndex(value, { maxIndex: maxPageIndex })
    },
    [maxPageIndex, navigateToPageIndex],
  )

  return (
    <>
      <div className="px-3">
        <Slider
          aria-label="페이지 이동"
          aria-valuetext={`${currentPageText} / ${maxPage}`}
          className="h-6"
          max={maxPageIndex}
          onValueCommit={handleValueCommit}
          value={pageIndex}
        />
      </div>
      <div aria-atomic="true" aria-live="polite" className="flex justify-center gap-1 text-xs">
        <span>{currentPageText}</span>/
        {maxPage > 0 ? <span>{maxPage}</span> : <Loader2 className="size-4 animate-spin" />}
      </div>
    </>
  )
}
