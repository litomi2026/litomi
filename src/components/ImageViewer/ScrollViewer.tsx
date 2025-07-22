'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRouter } from 'next/navigation'
import { memo, RefObject, useCallback, useEffect, useRef } from 'react'
import { useInView } from 'react-intersection-observer'

import { MangaIdSourceSearchParam } from '@/app/manga/[id]/[source]/constants'
import { PageView } from '@/components/ImageViewer/store/pageView'
import { ScreenFit } from '@/components/ImageViewer/store/screenFit'
import { useImageStatus } from '@/hook/useImageStatus'
import { type Manga } from '@/types/manga'
import { getSafeAreaBottom } from '@/utils/browser'

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
  itemHeightMap: RefObject<Map<number, number>>
}

export default memo(ScrollViewer)

function ScrollViewer({ manga, onClick, screenFit, pageView }: Readonly<Props>) {
  const { images } = manga
  const parentRef = useRef<HTMLDivElement>(null)
  const setVirtualizer = useVirtualizerStore((state) => state.setVirtualizer)
  const isDoublePage = pageView === 'double'
  const rowCount = isDoublePage ? Math.ceil(images.length / 2) : images.length
  const itemHeightMap = useRef(new Map<number, number>())

  const virtualizer = useVirtualizer({
    count: rowCount,
    estimateSize: useCallback((index) => itemHeightMap.current.get(index) || window.innerHeight, []),
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
          className={`absolute top-0 left-0 w-full [&_li]:flex [&_img]:border [&_img]:border-background 
            [&_img]:aria-invalid:w-40 [&_img]:aria-invalid:h-40 [&_img]:aria-invalid:text-foreground 
            ${screenFitStyle[screenFit]}`}
          style={{ transform: `translateY(${translateY}px)` }}
        >
          {virtualItems.map(({ index, key }) => (
            <VirtualItemMemo
              index={index}
              itemHeightMap={itemHeightMap}
              key={key}
              manga={manga}
              pageView={pageView}
              virtualizer={virtualizer}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

const VirtualItemMemo = memo(VirtualItem)

function VirtualItem({ index, manga, virtualizer, pageView, itemHeightMap }: VirtualItemProps) {
  const setImageIndex = useImageIndexStore((state) => state.setImageIndex)
  const isDoublePage = pageView === 'double'
  const firstImageIndex = isDoublePage ? index * 2 : index
  const nextImageIndex = firstImageIndex + 1
  const firstImageStatus = useImageStatus()
  const nextImageStatus = useImageStatus()
  const router = useRouter()

  const { ref, inView } = useInView({
    threshold: 0,
    rootMargin: '-50% 0% -50% 0%',
  })

  useEffect(() => {
    if (inView) {
      const newImageIndex = firstImageIndex
      setImageIndex(newImageIndex)
      router.replace(`?${MangaIdSourceSearchParam.PAGE}=${newImageIndex + 1}`)
    }
  }, [firstImageIndex, inView, router, setImageIndex])

  function registerRef(element: HTMLLIElement | null) {
    if (firstImageStatus.loaded && (!isDoublePage || nextImageStatus.loaded)) {
      virtualizer.measureElement(element)

      if (firstImageStatus.success && (!isDoublePage || nextImageStatus.success) && element) {
        const { height } = element.getBoundingClientRect()
        itemHeightMap.current.set(index, height)
      }
    }
  }

  return (
    <li data-index={index} ref={registerRef}>
      <MangaImage
        aria-invalid={firstImageStatus.error}
        fetchPriority="high"
        imageIndex={firstImageIndex}
        imageRef={ref}
        manga={manga}
        onError={firstImageStatus.handleError}
        onLoad={firstImageStatus.handleSuccess}
      />
      {isDoublePage && (
        <MangaImage
          aria-invalid={nextImageStatus.error}
          fetchPriority="high"
          imageIndex={nextImageIndex}
          manga={manga}
          onError={nextImageStatus.handleError}
          onLoad={nextImageStatus.handleSuccess}
        />
      )}
    </li>
  )
}
