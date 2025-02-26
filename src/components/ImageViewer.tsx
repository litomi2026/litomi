/* eslint-disable @next/next/no-img-element */
'use client'

import { BASE_URL } from '@/common/constant'
import useImageNavigation from '@/hook/useImageNavigation'
import { type Manga } from '@/types/manga'
import { useState } from 'react'

type Props = {
  manga: Manga
}

export default function ImageViewer({ manga }: Props) {
  const { id, images } = manga
  const maxImageIndex = images.length - 1
  const { currentIndex, setPrevIndex, setNextIndex } = useImageNavigation({
    maxImageIndex,
  })
  const [showInfo, setShowInfo] = useState(false)

  return (
    <ul className="relative">
      {showInfo && (
        <div className="fixed bg-black rounded px-2 top-0 left-1/2 -translate-x-1/2">
          {currentIndex + 1} / {maxImageIndex + 1}
        </div>
      )}
      {Array.from({ length: 10 }).map((_, offset) => {
        const imageIndex = currentIndex + offset
        if (imageIndex > maxImageIndex) return

        return (
          <img
            key={offset}
            onClick={() => setShowInfo((prev) => !prev)}
            alt={`manga-image-${currentIndex + offset}`}
            aria-hidden={offset !== 0}
            className="h-dvh mx-auto object-contain aria-hidden:h-1 aria-hidden:w-1 aria-hidden:absolute aria-hidden:-top-1 aria-hidden:-left-1"
            fetchPriority="high"
            referrerPolicy="no-referrer"
            src={`${BASE_URL}/${id}/${images[imageIndex].name}`}
          />
        )
      })}
      <div
        className="absolute left-0 top-0 h-full w-1/3 cursor-pointer focus:outline-none"
        onClick={() => setPrevIndex()}
      />
      <div
        className="absolute right-0 top-0 h-full w-1/3 cursor-pointer focus:outline-none"
        onClick={() => setNextIndex()}
      />
    </ul>
  )
}
