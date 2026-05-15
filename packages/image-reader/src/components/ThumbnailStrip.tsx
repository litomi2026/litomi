'use client'

import type { ReaderLayout, ReaderPage, ReaderPageRenderer } from '#reader/model/readerLayout'

import { useReaderStore } from '#reader/state/readerStore'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

type Props<TPage extends ReaderPage> = {
  pages: readonly TPage[]
  readerLayout: ReaderLayout<TPage>
  renderThumbnail: ReaderPageRenderer<TPage>
}

export default function ThumbnailStrip<TPage extends ReaderPage>({
  pages,
  readerLayout,
  renderThumbnail,
}: Props<TPage>) {
  const navigateToPageIndex = useReaderStore((state) => state.navigateToPageIndex)
  const pageIndex = useReaderStore((state) => state.pageIndex)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { ref: firstImageRef, inView: isFirstImageInView } = useInView()
  const { ref: lastImageRef, inView: isLastImageInView } = useInView()

  const activeSpreadIndex = readerLayout.spreadIndexByPageIndex[pageIndex] ?? 0
  const activePageIndexes = new Set(readerLayout.spreads[activeSpreadIndex]?.pageIndexes ?? [pageIndex])
  const activeThumbnailIndex = readerLayout.spreads[activeSpreadIndex]?.startPageIndex ?? pageIndex

  function handleThumbnailClick(index: number) {
    navigateToPageIndex(index, {
      maxIndex: Math.max(0, pages.length - 1),
      scrollRowIndex: readerLayout.spreadIndexByPageIndex[index] ?? index,
    })
  }

  function scrollLeft() {
    const container = scrollContainerRef.current
    if (container) {
      const scrollAmount = container.clientWidth * 0.8
      container.scrollTo({
        left: container.scrollLeft - scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  function scrollRight() {
    const container = scrollContainerRef.current
    if (container) {
      const scrollAmount = container.clientWidth * 0.8
      container.scrollTo({
        left: container.scrollLeft + scrollAmount,
        behavior: 'smooth',
      })
    }
  }

  // NOTE: 현재 페이지에 해당하는 썸네일을 가운데 정렬
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) {
      return
    }

    const thumbnailElements = container.querySelectorAll('button')
    const activeThumbnail = thumbnailElements[activeThumbnailIndex]
    if (!activeThumbnail) {
      return
    }

    activeThumbnail.scrollIntoView({ inline: 'center' })
  }, [activeThumbnailIndex])

  return (
    <div className="relative overflow-hidden flex justify-center">
      <button
        aria-label="이전 미리보기"
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-r-lg bg-background/90 transition hover:bg-background
        disabled:opacity-0 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/70"
        disabled={isFirstImageInView}
        onClick={scrollLeft}
        title="이전 미리보기"
        type="button"
      >
        <ChevronLeft className="size-5 stroke-3" />
      </button>
      <button
        aria-label="다음 미리보기"
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 rounded-l-lg bg-background/90 transition hover:bg-background
        disabled:opacity-0 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/70"
        disabled={isLastImageInView}
        onClick={scrollRight}
        title="다음 미리보기"
        type="button"
      >
        <ChevronRight className="size-5 stroke-3" />
      </button>
      <div
        className="flex gap-1 p-2 pb-4 overscroll-none overflow-x-auto scrollbar-hidden"
        onWheel={(e) => e.stopPropagation()}
        ref={scrollContainerRef}
      >
        {pages.map((page, i) => {
          const isActive = activePageIndexes.has(i)
          const fetchPriority = i > activeThumbnailIndex - 3 && i <= activeThumbnailIndex + 3 ? 'high' : 'low'

          return (
            <button
              aria-current={isActive ? 'page' : undefined}
              aria-label={`${i + 1}페이지로 이동`}
              className="relative shrink-0 w-16 h-20 rounded overflow-hidden border-2 transition 
              aria-current:border-foreground aria-current:scale-105 active:scale-95 hover:ring-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/70"
              key={page.id}
              onClick={() => handleThumbnailClick(i)}
              ref={i === 0 ? firstImageRef : i === pages.length - 1 ? lastImageRef : undefined}
              type="button"
            >
              {renderThumbnail({
                fetchPriority,
                isActive,
                isLowDataMode: false,
                page,
                pageIndex: i,
                spreadIndex: readerLayout.spreadIndexByPageIndex[i] ?? i,
              })}
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 rounded-t-lg bg-background/80 text-xs text-center p-2 py-0.5">
                {i + 1}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
