'use client'

import { usePageViewStore } from '@/store/controller/pageView'
import { useScreenFitStore } from '@/store/controller/screenFit'
import { type Manga } from '@/types/manga'
import { useVirtualizer } from '@tanstack/react-virtual'
import { memo, RefObject, useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

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
  errorMapRef: RefObject<Map<number, boolean>>
}

export default function ScrollViewer({ manga, onClick }: Props) {
  const { images } = manga
  const parentRef = useRef<HTMLDivElement>(null)
  const pageView = usePageViewStore((state) => state.pageView)
  const screenFit = useScreenFitStore((state) => state.screenFit)
  const rowCount = pageView === 'double' ? Math.ceil(images.length / 2) : images.length
  const [imageErrors, setImageErrors] = useState({ errors: [] as number[] })

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => window.innerHeight, []),
    overscan: 5,
  })

  const virtualItems = virtualizer.getVirtualItems()
  const translateY = virtualItems[0]?.start ?? 0

  const screenFitStyle = {
    width: '[&_li]:justify-center [&_img]:min-w-0 [&_img]:w-fit [&_img]:max-w-dvw [&_img]:max-h-fit',

    // TODO: Fix this
    height:
      '[&_li]:overflow-x-auto [&_li]:overscroll-none [&_li]:justify-center [&_li]:w-full [&_img]:w-auto [&_img]:max-w-fit [&_img]:h-dvh [&_img]:max-h-fit',
    // TODO: Fix this
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
            <VirtualItemMemo
              index={index}
              isError={imageErrors.errors[index]}
              key={key}
              manga={manga}
              setImageErrors={setImageErrors}
              virtualizer={virtualizer}
            />
          ))}
        </ul>
      </div>
    </div>
  )
}

const VirtualItemMemo = memo(VirtualItem)

function VirtualItem({ index, manga, virtualizer, isError, setImageErrors }: VirtualItemProps) {
  const pageView = usePageViewStore((state) => state.pageView)
  const isDoublePage = pageView === 'double'
  const imageIndex = isDoublePage ? index * 2 : index
  const nextImageIndex = imageIndex + 1

  return (
    <ResizeObserverWrapper as="li" data-index={index} onResize={(el) => virtualizer.measureElement(el)}>
      <MangaImage
        imageIndex={imageIndex}
        manga={manga}
        onError={() =>
          setImageErrors((prev) => {
            prev.errors[imageIndex] = true
            return { errors: prev.errors }
          })
        }
        {...(isError && { src: '/logo.svg' })}
      />
      {isDoublePage && (
        <MangaImage
          // aria-hidden={isError2}
          className="aria-hidden:hidden"
          imageIndex={nextImageIndex}
          manga={manga}
          // onError={() => setIsError2(true)}
        />
      )}
    </ResizeObserverWrapper>
  )
}
