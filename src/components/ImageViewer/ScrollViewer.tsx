'use client'

import { PageView } from '@/components/ImageViewer/store/pageView'
import { ScreenFit } from '@/components/ImageViewer/store/screenFit'
import { type Manga } from '@/types/manga'
import { getSafeAreaBottom } from '@/utils/browser'
import { useVirtualizer } from '@tanstack/react-virtual'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'

import MangaImage from '../MangaImage'
import { useImageIndexStore } from './store/imageIndex'
import { useVirtualizerStore } from './store/virtualizer'

const screenFitStyle: Record<ScreenFit, string> = {
  width: '[&_li]:justify-center [&_img]:my-auto [&_img]:min-w-0 [&_img]:max-w-fit [&_img]:max-h-fit',
  all: '[&_li]:justify-center [&_img]:my-auto [&_img]:min-w-0 [&_img]:max-w-fit [&_img]:max-h-dvh',
  height:
    '[&_li]:overflow-x-auto [&_li]:overscroll-x-none [&_li]:mx-auto [&_li]:w-fit [&_li]:max-w-full [&_img]:w-auto [&_img]:max-w-fit [&_img]:h-dvh [&_img]:max-h-fit',
}

type Props = {
  manga: Manga
  onClick: () => void
  pageView: PageView
  screenFit: ScreenFit
}

type VirtualItemProps = {
  index: number
  manga: Manga
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>
  pageView: PageView
}

export default memo(ScrollViewer)

function ScrollViewer({ manga, onClick, screenFit, pageView }: Props) {
  const { images } = manga
  const parentRef = useRef<HTMLDivElement>(null)
  const setVirtualizer = useVirtualizerStore((state) => state.setVirtualizer)
  const isDoublePage = pageView === 'double'
  const rowCount = isDoublePage ? Math.ceil(images.length / 2) : images.length

  const virtualizer = useVirtualizer({
    count: rowCount,
    estimateSize: useCallback(() => window.innerHeight, []),
    getScrollElement: useCallback(() => parentRef.current, []),
    overscan: 1,
    useAnimationFrameWithResizeObserver: true,
    paddingEnd: getSafeAreaBottom(),
  })

  useEffect(() => {
    setVirtualizer(virtualizer)
    return () => setVirtualizer(null)
  }, [setVirtualizer, virtualizer])

  const virtualItems = virtualizer.getVirtualItems()
  const translateY = virtualItems[0]?.start ?? 0

  return (
    <div className="overflow-y-auto overscroll-none contain-strict h-dvh select-none" onClick={onClick} ref={parentRef}>
      <div className="w-full relative" style={{ height: virtualizer.getTotalSize() }}>
        <ul
          className={`absolute top-0 left-0 w-full [&_li]:flex [&_img]:border [&_img]:border-background [&_img]:aria-hidden:w-40 [&_img]:aria-hidden:text-foreground ${screenFitStyle[screenFit]}`}
          style={{ transform: `translateY(${translateY}px)` }}
        >
          {virtualItems.map(({ index, key }) => (
            <VirtualItemMemo index={index} key={key} manga={manga} pageView={pageView} virtualizer={virtualizer} />
          ))}
        </ul>
      </div>
    </div>
  )
}

const VirtualItemMemo = memo(VirtualItem)

function VirtualItem({ index, manga, virtualizer, pageView }: VirtualItemProps) {
  const setImageIndex = useImageIndexStore((state) => state.setImageIndex)
  const isDoublePage = pageView === 'double'
  const firstImageIndex = isDoublePage ? index * 2 : index
  const nextImageIndex = firstImageIndex + 1
  const [[firstImageLoaded, nextImageLoaded], setImageLoaded] = useState([false, false])
  const [[firstImageError, nextImageError], setImageErrors] = useState([false, false])

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '-50% 0% -50% 0%',
  })

  useEffect(() => {
    if (inView) {
      setImageIndex(firstImageIndex)
    }
  }, [firstImageIndex, inView, setImageIndex])

  const handleFirstImageLoaded = useCallback(() => setImageLoaded((prev) => [true, prev[1]]), [])
  const handleNextImageLoaded = useCallback(() => setImageLoaded((prev) => [prev[0], true]), [])
  const handleFirstImageError = useCallback(() => setImageErrors((prev) => [true, prev[1]]), [])
  const handleNextImageError = useCallback(() => setImageErrors((prev) => [prev[0], true]), [])

  return (
    <li
      data-index={index}
      ref={(element) =>
        firstImageLoaded && (!isDoublePage || nextImageLoaded) ? virtualizer.measureElement(element) : undefined
      }
    >
      <MangaImage
        aria-hidden={firstImageError}
        fetchPriority="high"
        imageIndex={firstImageIndex}
        imageRef={ref}
        manga={manga}
        onError={handleFirstImageError}
        onLoad={handleFirstImageLoaded}
        {...(firstImageError && { src: '/image/fallback.svg' })}
      />
      {isDoublePage && (
        <MangaImage
          aria-hidden={nextImageError}
          fetchPriority="high"
          imageIndex={nextImageIndex}
          manga={manga}
          onError={handleNextImageError}
          onLoad={handleNextImageLoaded}
          {...(nextImageError && { src: '/image/fallback.svg' })}
        />
      )}
    </li>
  )
}
