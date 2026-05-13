import { Loader2 } from 'lucide-react'

import Slider from '@/components/ui/Slider'

import type { ReaderLayout, ReaderPage } from './readerPages'

import { useReaderStore } from './store/reader'

type Props<TPage extends ReaderPage> = {
  maxPageIndex: number
  readerLayout: ReaderLayout<TPage>
}

export default function ImageSlider<TPage extends ReaderPage>({ maxPageIndex, readerLayout }: Props<TPage>) {
  const pageIndex = useReaderStore((state) => state.pageIndex)
  const navigateToPageIndex = useReaderStore((state) => state.navigateToPageIndex)

  const activeSpreadIndex = readerLayout.spreadIndexByPageIndex[pageIndex] ?? 0
  const activeSpread = readerLayout.spreads[activeSpreadIndex]
  const maxPage = readerLayout.spreadIndexByPageIndex.length

  const visiblePageNumbers =
    maxPage > 0 ? (activeSpread?.pageIndexes.map((visiblePageIndex) => visiblePageIndex + 1) ?? [pageIndex + 1]) : []

  const currentPageText = getPageRangeText(visiblePageNumbers)

  return (
    <>
      <div className="px-3">
        <Slider
          aria-label="페이지 이동"
          aria-valuetext={`${currentPageText} / ${maxPage}`}
          className="h-6"
          max={maxPageIndex}
          onValueCommit={(value) => {
            navigateToPageIndex(value, {
              maxIndex: maxPageIndex,
              scrollRowIndex: readerLayout.spreadIndexByPageIndex[value] ?? value,
            })
          }}
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

function getPageRangeText(pageNumbers: number[]) {
  if (pageNumbers.length === 0) {
    return 0
  }

  if (pageNumbers.length === 1) {
    return pageNumbers[0]
  }

  const firstPage = pageNumbers[0]
  const lastPage = pageNumbers[pageNumbers.length - 1]
  return `${firstPage}-${lastPage}`
}
