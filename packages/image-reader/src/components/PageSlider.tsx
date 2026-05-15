import type { ReaderLayout, ReaderPage } from '#reader/model/readerLayout'

import { useReaderMessages } from '#reader/readerRuntime'
import { useReaderStore } from '#reader/state/readerStore'
import { Slider } from '@litomi/ui'
import { Loader2 } from 'lucide-react'

type Props<TPage extends ReaderPage> = {
  maxPageIndex: number
  readerLayout: ReaderLayout<TPage>
}

export default function PageSlider<TPage extends ReaderPage>({ maxPageIndex, readerLayout }: Props<TPage>) {
  const pageIndex = useReaderStore((state) => state.pageIndex)
  const navigateToPageIndex = useReaderStore((state) => state.navigateToPageIndex)
  const messages = useReaderMessages()

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
          aria-label={messages.pageSliderLabel}
          aria-valuetext={messages.pageSliderValue(currentPageText, maxPage)}
          className="h-6"
          max={maxPageIndex}
          onValueCommit={(value) => {
            navigateToPageIndex(value, {
              maxIndex: maxPageIndex,
              navigationType: 'absolute',
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
