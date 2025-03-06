'use client'

import { getImageSrc } from '@/constants/url'
import { type Manga } from '@/types/manga'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef } from 'react'

const INITIAL_DISPLAYED_IMAGE = 5

type Props = {
  manga: Manga
  isDoublePage: boolean
  onImageClick: () => void
}

export default function ScrollViewer({ manga, isDoublePage, onImageClick }: Props) {
  const { images, cdn, id } = manga
  const parentRef = useRef<HTMLDivElement>(null)
  const rowCount = isDoublePage ? Math.ceil(images.length / 2) : images.length

  const rowVirtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => window.innerHeight,
    overscan: 5,
  })

  function VirtualRow({ index }: { index: number }) {
    if (isDoublePage) {
      const firstIndex = index * 2
      const secondIndex = firstIndex + 1
      return (
        <>
          <img
            alt={`manga-image-${firstIndex + 1}`}
            fetchPriority={index < INITIAL_DISPLAYED_IMAGE ? 'high' : undefined}
            referrerPolicy="same-origin"
            src={getImageSrc({ cdn, id, name: images[firstIndex].name })}
          />
          {images[secondIndex] && (
            <img
              alt={`manga-image-${secondIndex + 1}`}
              fetchPriority={index < INITIAL_DISPLAYED_IMAGE ? 'high' : undefined}
              referrerPolicy="same-origin"
              src={getImageSrc({ cdn, id, name: images[secondIndex].name })}
            />
          )}
        </>
      )
    } else {
      return (
        <img
          alt={`manga-image-${index + 1}`}
          fetchPriority={index < INITIAL_DISPLAYED_IMAGE ? 'high' : undefined}
          referrerPolicy="same-origin"
          src={getImageSrc({ cdn, id, name: images[index].name })}
        />
      )
    }
  }

  const virtualItems = rowVirtualizer.getVirtualItems()
  const translateY = virtualItems[0]?.start ?? 0

  return (
    <div className="overflow-y-auto contain-strict h-dvh" onClick={onImageClick} ref={parentRef}>
      <div className="w-full relative" style={{ height: rowVirtualizer.getTotalSize() }}>
        <ul
          className="absolute top-0 left-0 w-full [&_li]:flex [&_li]:justify-center [&_img]:min-w-0 [&_img]:select-none [&_img]:border [&_img]:border-gray-800"
          style={{ transform: `translateY(${translateY}px)` }}
        >
          {virtualItems.map(({ index, key }) => (
            <li data-index={index} key={key} ref={rowVirtualizer.measureElement}>
              <VirtualRow index={index} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
