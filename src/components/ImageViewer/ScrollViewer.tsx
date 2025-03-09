'use client'

import { usePageViewStore } from '@/store/controller/pageView'
import { useScreenFitStore } from '@/store/controller/screenFit'
import { type Manga } from '@/types/manga'
import { useVirtualizer } from '@tanstack/react-virtual'
import { memo, RefObject, useCallback, useRef } from 'react'

import MangaImage from '../MangaImage'
import ResizeObserverWrapper from '../ResizeObserverWrapper'

type Props = {
  manga: Manga
  onClick: () => void
}

type VirtualItemProps = {
  index: number
  manga: Manga
  virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>
  sizeMapRef: RefObject<Map<number, number>>
}

export default function ScrollViewer({ manga, onClick }: Props) {
  const { images } = manga
  const parentRef = useRef<HTMLDivElement>(null)
  const pageView = usePageViewStore((state) => state.pageView)
  const screenFit = useScreenFitStore((state) => state.screenFit)
  const rowCount = pageView === 'double' ? Math.ceil(images.length / 2) : images.length
  const sizeMapRef = useRef(new Map())

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback((index) => {
      return sizeMapRef.current.get(index) ?? window.innerHeight
    }, []),
    overscan: 5,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const translateY = virtualItems[0]?.start ?? 0

  // TODO: Fix this
  const screenFitStyle = {
    width: '[&_li]:justify-center [&_img]:min-w-0 [&_img]:box-content [&_img]:max-w-fit [&_img]:max-h-fit',
    height:
      '[&_li]:overflow-x-auto [&_li]:overscroll-none [&_li]:justify-center [&_li]:w-full [&_img]:w-auto [&_img]:max-w-fit [&_img]:h-dvh [&_img]:max-h-fit',
    all: '[&_li]:justify-center [&_li]:mx-auto [&_img]:min-w-0 [&_img]:w-auto [&_img]:max-w-fit [&_img]:max-h-dvh',
  }[screenFit]

  return (
    <div className="overflow-y-auto overscroll-none contain-strict h-dvh select-none" onClick={onClick} ref={parentRef}>
      <div className="w-full relative" style={{ height: virtualizer.getTotalSize() }}>
        <ul
          className={`absolute top-0 left-0 w-full pb-safe [&_li]:flex [&_img]:border [&_img]:border-background ${screenFitStyle}`}
          style={{ transform: `translateY(${translateY}px)` }}
        >
          {virtualItems.map(({ index, key }) => (
            <VirtualItemMemo index={index} key={key} manga={manga} sizeMapRef={sizeMapRef} virtualizer={virtualizer} />
          ))}
        </ul>
      </div>
    </div>
  )
}

const VirtualItemMemo = memo(VirtualItem)

function VirtualItem({ index, manga, virtualizer, sizeMapRef }: VirtualItemProps) {
  const pageView = usePageViewStore((state) => state.pageView)
  const isDoublePage = pageView === 'double'
  const imageIndex = isDoublePage ? index * 2 : index

  return (
    <li data-index={index}>
      <ResizeObserverWrapper
        onResize={(el) => {
          const rect = el.getBoundingClientRect()
          if (rect.height < 10) return

          console.log('👀 - rect:', rect.height)
          // 캐싱: 각 아이템의 실제 높이를 저장
          sizeMapRef.current.set(index, rect.height)
          virtualizer.measureElement(el)
        }}
      >
        <MangaImage imageIndex={imageIndex} manga={manga} />
        {isDoublePage && <MangaImage imageIndex={imageIndex + 1} manga={manga} />}
      </ResizeObserverWrapper>
    </li>
  )
}
