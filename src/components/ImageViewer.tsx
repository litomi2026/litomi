/* eslint-disable @next/next/no-img-element */
'use client'

import { getImageSrc } from '@/constants/url'
import useImageNavigation from '@/hook/useImageNavigation'
import { usePageViewStore } from '@/store/controller/pageView'
import { type Manga } from '@/types/manga'
import { useEffect, useState } from 'react'

import useNavigationTouchArea from '../hook/useNavigationTouchArea'
import IconUndo from './icons/IconUndo'
import Slider from './Slider'

type Props = {
  manga: Manga
}

export default function ImageViewer({ manga }: Props) {
  const { id, images, title, cdn } = manga
  const maxImageIndex = images.length - 1

  const [showController, setShowController] = useState(false)
  const [navMode, setNavMode] = useState<'scroll' | 'touch'>('touch')
  const { pageView, setPageView } = usePageViewStore()

  const isDoublePage = pageView === 'double'

  const { currentIndex, setCurrentIndex, prevPage, nextPage } = useImageNavigation({
    maxIndex: maxImageIndex,
    offset: isDoublePage ? 2 : 1,
  })

  const { touchOrientation, setTouchOrientation, NavigationTouchArea } = useNavigationTouchArea({
    onNext: nextPage,
    onPrev: prevPage,
  })

  const isSinglePage = pageView === 'single'
  const isTouchMode = navMode === 'touch'
  const isHorizontalTouch = touchOrientation === 'horizontal'
  const startPage = Math.max(1, currentIndex + 1)
  const endPage = isDoublePage ? Math.min(currentIndex + 2, maxImageIndex + 1) : startPage

  useEffect(() => {
    if (isTouchMode) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'auto'
      }
    }
  }, [isTouchMode])

  return (
    <ul className="relative select-none [&_li]:flex [&_li]:justify-center [&_li]:gap-1 [&_img]:h-dvh [&_img]:min-w-0 [&_img]:object-contain [&_img]:select-none [&_img]:aria-hidden:sr-only">
      {showController && (
        <div className="fixed top-0 border-gray-600 left-0 right-0 bg-black/80 backdrop-blur border-b px-safe z-10">
          <div className="p-2">
            <h1 className="text-center line-clamp-3 font-bold">{title}</h1>
          </div>
        </div>
      )}
      {Array.from({ length: 10 }).map((_, offset) => {
        const imageIndex = currentIndex + offset
        const nextImageIndex = imageIndex + 1

        return (
          <li key={offset} onClick={() => setShowController((prev) => !prev)}>
            {0 <= imageIndex && imageIndex <= maxImageIndex && (
              <img
                alt={`manga-image-${imageIndex + 1}`}
                aria-hidden={offset !== 0}
                fetchPriority={imageIndex < 5 ? 'high' : undefined}
                referrerPolicy="same-origin"
                src={getImageSrc({ cdn, id, name: images[imageIndex].name })}
              />
            )}
            {isDoublePage && offset === 0 && 0 <= nextImageIndex && nextImageIndex <= maxImageIndex && (
              <img
                alt={`manga-image-${nextImageIndex + 1}`}
                fetchPriority={nextImageIndex < 5 ? 'high' : undefined}
                referrerPolicy="same-origin"
                src={getImageSrc({ cdn, id, name: images[nextImageIndex].name })}
              />
            )}
          </li>
        )
      })}
      {isTouchMode && <NavigationTouchArea />}
      {showController && (
        <div className="fixed border-t border-gray-600 select-none bg-black/80 backdrop-blur bottom-0 left-0 right-0 px-safe pb-safe">
          <div className="p-2 md:p-3 grid gap-1">
            <div className="grid gap-2 ml-2 mr-1 grid-cols-[1fr_auto]">
              <Slider
                max={maxImageIndex}
                onValueCommit={(value) => setCurrentIndex(value)}
                step={1}
                value={currentIndex}
              />
              {/* <button>
                <IconUndo className="w-5" />
              </button> */}
            </div>
            <div className="rounded text-center text-xs mx-auto">
              {startPage === endPage ? startPage : `${startPage}-${endPage}`} / {maxImageIndex + 1}
            </div>
            <div className="font-medium whitespace-nowrap flex-wrap justify-center text-sm flex gap-2 text-black [&_button]:rounded-full [&_button]:bg-gray-100 [&_button]:px-2 [&_button]:py-1 [&_button]:hover:bg-white [&_button]:active:bg-gray-400">
              <button onClick={() => setPageView(isSinglePage ? 'double' : 'single')}>
                {isSinglePage ? '한 쪽' : '두 쪽'} 보기
              </button>
              <button onClick={() => setTouchOrientation(isHorizontalTouch ? 'vertical' : 'horizontal')}>
                {isHorizontalTouch ? '좌우' : '상하'} 넘기기
              </button>
              <button onClick={() => setNavMode('touch')}>{isTouchMode ? '터치' : '스크롤'} 모드</button>
            </div>
          </div>
        </div>
      )}
    </ul>
  )
}
