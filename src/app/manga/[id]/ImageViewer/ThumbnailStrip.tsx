'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

import MangaImage from '@/components/MangaImage'
import { ImageVariant } from '@/types/manga'

import { usePageNavigationStore } from './store/pageNavigation'
import { usePageViewStore } from './store/pageView'

type Props = {
  images: (ImageVariant | undefined)[]
  mangaId: number
}

export default function ThumbnailStrip({ images, mangaId }: Props) {
  const { navigateToPageIndex, pageIndex } = usePageNavigationStore()
  const pageView = usePageViewStore((state) => state.pageView)
  const isDoublePage = pageView === 'double'
  const activeImageIndex = isDoublePage ? Math.floor(pageIndex / 2) * 2 : pageIndex
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const { ref: firstImageRef, inView: isFirstImageInView } = useInView()
  const { ref: lastImageRef, inView: isLastImageInView } = useInView()

  function handleThumbnailClick(index: number) {
    navigateToPageIndex(index, { maxIndex: images.length })
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
  }, [activeImageIndex])

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
        {images.map((image, i) => {
          const isActive = i === activeImageIndex
          const isSecondaryActive = isDoublePage && i === activeImageIndex + 1

          return (
            <button
              aria-current={isActive || isSecondaryActive ? 'page' : undefined}
              aria-label={`${i + 1}페이지로 이동`}
              className="relative shrink-0 w-16 h-20 rounded overflow-hidden border-2 transition 
              aria-current:border-foreground aria-current:scale-105 active:scale-95 hover:ring-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/70"
              key={i}
              onClick={() => handleThumbnailClick(i)}
              ref={i === 0 ? firstImageRef : i === images.length - 1 ? lastImageRef : undefined}
              type="button"
            >
              <MangaImage
                alt={`${i + 1}페이지 미리보기`}
                className="w-full h-full object-cover"
                fetchPriority={i > activeImageIndex - 3 && i <= activeImageIndex + 3 ? undefined : 'low'}
                imageIndex={i}
                mangaId={mangaId}
                src={image?.url}
                variant="thumbnail"
              />
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
