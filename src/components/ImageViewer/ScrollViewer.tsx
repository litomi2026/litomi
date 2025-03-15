'use client'

import { usePageViewStore } from '@/components/ImageViewer/store/pageView'
import { ScreenFit } from '@/components/ImageViewer/store/screenFit'
import { type Manga } from '@/types/manga'
import { getSafeAreaBottom } from '@/utils'
import { useVirtualizer } from '@tanstack/react-virtual'
import { memo, useCallback, useEffect, useRef, useState } from 'react'
import { useInView } from 'react-intersection-observer'

import MangaImage from '../MangaImage'
import { useImageIndexStore } from './store/imageIndex'
import { useVirtualizerStore } from './store/virtualizer'

const screenFitClasses = {
  width: '[&_li]:justify-center [&_img]:my-auto [&_img]:min-w-0 [&_img]:max-w-fit [&_img]:max-h-fit',
  all: '[&_li]:justify-center [&_img]:my-auto [&_img]:min-w-0 [&_img]:max-w-fit [&_img]:max-h-dvh',

  // TODO: Fix this
  height:
    '[&_li]:overflow-x-auto [&_li]:overscroll-none [&_li]:mx-auto [&_li]:w-fit [&_li]:max-w-full [&_img]:w-auto [&_img]:max-w-fit [&_img]:h-dvh [&_img]:max-h-fit',
}

type Props = {
  manga: Manga
  onClick: () => void
  screenFit: ScreenFit
}

type VirtualItemProps = {
  index: number
  manga: Manga
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>
}

export default memo(ScrollViewer)

function ScrollViewer({ manga, onClick, screenFit }: Props) {
  const { images } = manga
  const parentRef = useRef<HTMLDivElement>(null)
  const pageView = usePageViewStore((state) => state.pageView)
  const setVirtualizer = useVirtualizerStore((state) => state.setVirtualizer)
  const isDoublePage = pageView === 'double'
  const rowCount = isDoublePage ? Math.ceil(images.length / 2) : images.length

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => window.innerHeight, []),
    overscan: 5,
    useAnimationFrameWithResizeObserver: true,
    paddingEnd: getSafeAreaBottom(),
  })

  useEffect(() => {
    setVirtualizer(virtualizer)
    return () => {
      setVirtualizer(null)
    }
  }, [setVirtualizer, virtualizer])

  const virtualItems = virtualizer.getVirtualItems()
  const translateY = virtualItems[0]?.start ?? 0

  return (
    <div className="overflow-y-auto overscroll-none contain-strict h-dvh select-none" onClick={onClick} ref={parentRef}>
      <div className="w-full relative" style={{ height: virtualizer.getTotalSize() }}>
        <ul
          className={`absolute top-0 left-0 w-full [&_li]:flex [&_img]:border [&_img]:border-background [&_img]:aria-hidden:w-40 [&_img]:aria-hidden:text-foreground ${screenFitClasses[screenFit]}`}
          style={{ transform: `translateY(${translateY}px)` }}
        >
          {virtualItems.map(({ index, key }) => (
            <VirtualItemMemo index={index} key={key} manga={manga} virtualizer={virtualizer} />
          ))}
        </ul>
      </div>
    </div>
  )
}

const VirtualItemMemo = memo(VirtualItem)

function VirtualItem({ index, manga, virtualizer }: VirtualItemProps) {
  const pageView = usePageViewStore((state) => state.pageView)
  const setImageIndex = useImageIndexStore((state) => state.setImageIndex)
  const isDoublePage = pageView === 'double'
  const imageIndex = isDoublePage ? index * 2 : index
  const nextImageIndex = imageIndex + 1
  const [[imageError, image2Error], setImageErrors] = useState([false, false])

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '-50% 0% -50% 0%',
  })

  useEffect(() => {
    if (inView) {
      setImageIndex(imageIndex)
    }
  }, [imageIndex, inView, setImageIndex])

  return (
    <li data-index={index} ref={virtualizer.measureElement}>
      <MangaImage
        aria-hidden={imageError}
        imageIndex={imageIndex}
        imageRef={ref}
        manga={manga}
        onError={() => setImageErrors((prev) => [true, prev[1]])}
        {...(imageError && { src: '/images/fallback.svg' })}
      />
      {isDoublePage && (
        <MangaImage
          aria-hidden={image2Error}
          imageIndex={nextImageIndex}
          manga={manga}
          onError={() => setImageErrors((prev) => [prev[0], true])}
          {...(image2Error && { src: '/images/fallback.svg' })}
        />
      )}
    </li>
  )
}
