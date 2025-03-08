'use client'

import { getImageSrc } from '@/constants/url'
import { usePageViewStore } from '@/store/controller/pageView'
import { useScreenFitStore } from '@/store/controller/screenFit'
import { type Manga } from '@/types/manga'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

const INITIAL_DISPLAYED_IMAGE = 5

type Props = {
  manga: Manga
  onImageClick: () => void
}

export default function ScrollViewer({ manga, onImageClick }: Props) {
  const { images } = manga
  const parentRef = useRef<HTMLDivElement>(null)
  const pageView = usePageViewStore((state) => state.pageView)
  const screenFit = useScreenFitStore((state) => state.screenFit)
  const rowCount = pageView === 'double' ? Math.ceil(images.length / 2) : images.length

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => window.innerHeight,
    overscan: 5,
  })

  const screenFitStyle = {
    width: '[&_li]:justify-center [&_img]:min-w-0 [&_img]:box-content [&_img]:max-w-fit [&_img]:max-h-fit',

    // TODO: Fix this
    height:
      '[&_li]:overflow-x-auto [&_li]:overscroll-none [&_li]:justify-center [&_li]:w-full [&_img]:w-auto [&_img]:max-w-fit [&_img]:h-dvh [&_img]:max-h-fit',
    // TODO: Fix this
    all: '[&_li]:justify-center [&_li]:mx-auto [&_img]:min-w-0 [&_img]:w-auto [&_img]:max-w-fit [&_img]:max-h-dvh',
  }[screenFit]

  const virtualItems = rowVirtualizer.getVirtualItems()
  const translateY = virtualItems[0]?.start ?? 0

  return (
    <div
      className="overflow-y-auto overscroll-none contain-strict h-dvh select-none"
      onClick={onImageClick}
      ref={parentRef}
    >
      <div className="w-full relative" style={{ height: rowVirtualizer.getTotalSize() }}>
        <ul
          className={`absolute top-0 left-0 w-full pb-safe [&_li]:flex [&_img]:border [&_img]:border-gray-800 ${screenFitStyle}`}
          style={{ transform: `translateY(${translateY}px)` }}
        >
          {virtualItems.map(({ index, key }) => (
            <li data-index={index} key={key} ref={rowVirtualizer.measureElement}>
              <VirtualRow index={index} manga={manga} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function VirtualRow({ index, manga }: { index: number; manga: Manga }) {
  const { images, cdn, id } = manga
  const pageView = usePageViewStore((state) => state.pageView)

  if (pageView === 'double') {
    const firstIndex = index * 2
    const secondIndex = firstIndex + 1
    const firstImage = images[firstIndex]
    const secondImage = images[secondIndex]
    return (
      <>
        <img
          alt={`manga-image-${firstIndex + 1}`}
          draggable={false}
          fetchPriority={index < INITIAL_DISPLAYED_IMAGE ? 'high' : 'low'}
          referrerPolicy="same-origin"
          src={getImageSrc({ cdn, id, name: firstImage.name })}
        />
        {secondImage && (
          <img
            alt={`manga-image-${secondIndex + 1}`}
            draggable={false}
            fetchPriority={index < INITIAL_DISPLAYED_IMAGE ? 'high' : 'low'}
            referrerPolicy="same-origin"
            src={getImageSrc({ cdn, id, name: secondImage.name })}
          />
        )}
      </>
    )
  } else {
    return (
      <img
        alt={`manga-image-${index + 1}`}
        draggable={false}
        fetchPriority={index < INITIAL_DISPLAYED_IMAGE ? 'high' : 'low'}
        height={images[index].height ?? 1536}
        referrerPolicy="same-origin"
        src={getImageSrc({ cdn, id, name: images[index].name })}
        width={images[index].width ?? 1536}
      />
    )
  }
}
