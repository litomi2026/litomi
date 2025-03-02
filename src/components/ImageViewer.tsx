/* eslint-disable @next/next/no-img-element */
'use client'

import { BASE_URL } from '@/constants/url'
import useImageNavigation from '@/hook/useImageNavigation'
import { type Manga } from '@/types/manga'
import { useEffect, useState } from 'react'

import useNavigationTouchArea from './useNavigationTouchArea'

type Props = {
  manga: Manga
}

export default function ImageViewer({ manga }: Props) {
  const { id, images } = manga
  const maxImageIndex = images.length - 1

  const [navMode, setNavMode] = useState<'scroll' | 'touch'>('touch')

  const { currentIndex, prevPage, nextPage } = useImageNavigation({
    maxIndex: maxImageIndex,
    offset: 1,
  })

  const { touchOrientation, setTouchOrientation, NavigationTouchArea } = useNavigationTouchArea({
    onNext: nextPage,
    onPrev: prevPage,
  })

  const [showController, setShowController] = useState(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [])

  return (
    <ul className="relative">
      {showController && (
        <div className="fixed top-0 left-1/2 z-10 -translate-x-1/2">
          <div className="grid gap-1 p-1">
            <div className="bg-black rounded px-2 mx-auto">
              {currentIndex + 1} / {maxImageIndex + 1}
            </div>
            {navMode === 'touch' && (
              <div className="flex gap-1">
                <button
                  aria-pressed={touchOrientation === 'horizontal'}
                  className="px-2 py-1 rounded border bg-gray-300 text-gray-500 border-gray-500 aria-pressed:bg-gray-800 aria-pressed:text-white"
                  onClick={() => setTouchOrientation('horizontal')}
                >
                  좌우 넘기기
                </button>
                <button
                  aria-pressed={touchOrientation === 'vertical'}
                  className="px-2 py-1 rounded border bg-gray-300 text-gray-500 border-gray-500 aria-pressed:bg-gray-800 aria-pressed:text-white"
                  onClick={() => setTouchOrientation('vertical')}
                >
                  상하 넘기기
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {Array.from({ length: 10 }).map((_, offset) => {
        const imageIndex = currentIndex + offset
        if (imageIndex > maxImageIndex) return

        return (
          <img
            alt={`manga-image-${currentIndex + 1 + offset}`}
            aria-hidden={offset !== 0}
            className="h-dvh mx-auto select-none object-contain aria-hidden:h-1 aria-hidden:w-1 aria-hidden:absolute aria-hidden:-top-1 aria-hidden:-left-1"
            key={offset}
            onClick={() => setShowController((prev) => !prev)}
            referrerPolicy="no-referrer"
            src={`${BASE_URL}/${id}/${images[imageIndex].name}`}
          />
        )
      })}
      {navMode === 'touch' && <NavigationTouchArea />}
    </ul>
  )
}
