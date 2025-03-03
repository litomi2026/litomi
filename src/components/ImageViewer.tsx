/* eslint-disable @next/next/no-img-element */
'use client'

import { BASE_URL } from '@/constants/url'
import useImageNavigation from '@/hook/useImageNavigation'
import { usePageViewStore } from '@/store/controller/pageView'
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

  const { pageView, setPageView } = usePageViewStore()

  const { currentIndex, prevPage, nextPage } = useImageNavigation({
    maxIndex: maxImageIndex,
    offset: pageView === 'double' ? 2 : 1,
  })

  const { touchOrientation, setTouchOrientation, NavigationTouchArea } = useNavigationTouchArea({
    onNext: nextPage,
    onPrev: prevPage,
  })

  const [showController, setShowController] = useState(false)

  useEffect(() => {
    if (navMode === 'touch') {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'auto'
      }
    }
  }, [navMode])

  const startPage = Math.max(1, currentIndex + 1)
  const endPage = pageView === 'double' ? Math.min(currentIndex + 2, maxImageIndex + 1) : startPage

  return (
    <ul className="[&_li]:flex [&_li]:justify-center [&_li]:gap-1 [&_img]:h-dvh [&_img]:min-w-0 [&_img]:select-none [&_img]:object-contain [&_img]:aria-hidden:sr-only">
      {showController && (
        <div className="fixed top-1 left-1/2 z-10 -translate-x-1/2">
          <div className="grid gap-1 grid-cols-2 p-1 border backdrop-blur rounded [&_button]:px-2 [&_button]:py-1 [&_button]:opacity-50 [&_button]:rounded [&_button]:border [&_button]:bg-gray-300 [&_button]:text-gray-500 [&_button]:border-gray-500 [&_button]:aria-pressed:opacity-100 [&_button]:aria-pressed:bg-gray-800 [&_button]:aria-pressed:text-white">
            <div className="bg-black col-span-2 rounded px-2 mx-auto">
              {startPage === endPage ? startPage : `${startPage}-${endPage}`} / {maxImageIndex + 1}
            </div>

            <button aria-pressed={pageView === 'single'} onClick={() => setPageView('single')}>
              한 쪽 보기
            </button>
            <button aria-pressed={pageView === 'double'} onClick={() => setPageView('double')}>
              두 쪽 보기
            </button>
            <button aria-pressed={navMode === 'touch'} onClick={() => setNavMode('touch')}>
              터치 모드
            </button>
            <button aria-pressed={navMode === 'scroll'} onClick={() => setNavMode('scroll')}>
              스크롤 모드
            </button>
            {navMode === 'touch' && (
              <>
                <button
                  aria-pressed={touchOrientation === 'horizontal'}
                  onClick={() => setTouchOrientation('horizontal')}
                >
                  좌우 넘기기
                </button>
                <button aria-pressed={touchOrientation === 'vertical'} onClick={() => setTouchOrientation('vertical')}>
                  상하 넘기기
                </button>
              </>
            )}
          </div>
        </div>
      )}
      {Array.from({ length: 10 }).map((_, offset) => {
        const imageIndex = currentIndex + offset

        return (
          <li key={offset}>
            {0 <= imageIndex && imageIndex <= maxImageIndex && (
              <img
                alt={`manga-image-${imageIndex + 1}`}
                aria-hidden={offset !== 0}
                fetchPriority={offset === 0 ? 'high' : 'auto'}
                onClick={() => setShowController((prev) => !prev)}
                referrerPolicy="same-origin"
                src={`${BASE_URL}/${id}/${images[imageIndex].name}`}
              />
            )}
            {pageView === 'double' && offset === 0 && 0 <= imageIndex + 1 && imageIndex + 1 <= maxImageIndex && (
              <img
                alt={`manga-image-${imageIndex + 2}`}
                fetchPriority={offset === 0 ? 'high' : undefined}
                onClick={() => setShowController((prev) => !prev)}
                referrerPolicy="same-origin"
                src={`${BASE_URL}/${id}/${images[imageIndex + 1].name}`}
              />
            )}
          </li>
        )
      })}
      {navMode === 'touch' && <NavigationTouchArea />}
    </ul>
  )
}
