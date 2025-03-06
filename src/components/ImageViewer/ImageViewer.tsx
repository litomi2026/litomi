'use client'

import useImageNavigation from '@/hook/useImageNavigation'
import { useNavigationModeStore } from '@/store/controller/navigationMode'
import { usePageViewStore } from '@/store/controller/pageView'
import { type Manga } from '@/types/manga'
import { useEffect, useState } from 'react'

import useTouchNavigator from '../../hook/useNavigationTouchArea'
import Slider from '../Slider'
import ScrollViewer from './ScrollViewer'
import TouchViewer from './TouchViewer'

type Props = {
  manga: Manga
}

export default function ImageViewer({ manga }: Props) {
  const { images, title } = manga
  const imageCount = images.length
  const maxImageIndex = imageCount - 1
  const [showController, setShowController] = useState(false)
  const { navMode, setNavMode } = useNavigationModeStore()
  const { pageView, setPageView } = usePageViewStore()
  const isDoublePage = pageView === 'double'
  const isTouchMode = navMode === 'touch'
  const isScrollMode = navMode === 'scroll'

  const { currentIndex, setCurrentIndex, prevPage, nextPage } = useImageNavigation({
    maxIndex: maxImageIndex,
    offset: isDoublePage ? 2 : 1,
  })

  const { touchOrientation, setTouchOrientation, TouchNavigator } = useTouchNavigator({
    onNext: nextPage,
    onPrev: prevPage,
  })

  const isHorizontalTouch = touchOrientation === 'horizontal'
  const startPage = Math.max(1, currentIndex + 1)
  const endPage = isDoublePage ? Math.min(currentIndex + 2, imageCount) : startPage

  useEffect(() => {
    document.body.style.overflow = isTouchMode ? 'hidden' : 'auto'
    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isTouchMode])

  return (
    <div className="relative">
      {showController && (
        <div className="fixed top-0 border-gray-500 left-0 right-0 bg-black/70 backdrop-blur border-b px-safe z-10">
          <div className="p-3">
            <h1 className="text-center line-clamp-3 font-bold">{title}</h1>
          </div>
        </div>
      )}

      {isTouchMode ? (
        <>
          <TouchViewer
            currentIndex={currentIndex}
            isDoublePage={isDoublePage}
            manga={manga}
            onImageClick={() => setShowController((prev) => !prev)}
          />
          <TouchNavigator />
        </>
      ) : (
        <ScrollViewer
          isDoublePage={isDoublePage}
          manga={manga}
          onImageClick={() => setShowController((prev) => !prev)}
        />
      )}

      {showController && (
        <div className="fixed border-t border-gray-500 select-none bg-black/70 backdrop-blur bottom-0 left-0 right-0 px-safe pb-safe">
          <div className="p-3 md:p-4 grid gap-1">
            {isTouchMode && (
              <>
                <div className="grid gap-2 ml-2 mr-1 grid-cols-[1fr_auto]">
                  <Slider
                    max={maxImageIndex}
                    onValueCommit={(value) => setCurrentIndex(value)}
                    step={1}
                    value={currentIndex}
                  />
                </div>
                <div className="rounded text-center text-xs mx-auto">
                  {startPage === endPage ? startPage : `${startPage}-${endPage}`} / {imageCount}
                </div>
              </>
            )}
            <div className="font-medium whitespace-nowrap flex-wrap justify-center text-sm flex gap-2 text-black [&_button]:rounded-full [&_button]:bg-gray-100 [&_button]:px-2 [&_button]:py-1 [&_button]:hover:bg-white [&_button]:active:bg-gray-400 [&_button]:disabled:bg-gray-400 [&_button]:disabled:text-gray-500">
              <button onClick={() => setPageView(isDoublePage ? 'single' : 'double')}>
                {isDoublePage ? '두 쪽' : '한 쪽'} 보기
              </button>
              <button onClick={() => setNavMode(isTouchMode ? 'scroll' : 'touch')}>
                {isTouchMode ? '터치' : '스크롤'} 모드
              </button>
              <button
                disabled={isScrollMode}
                onClick={() => setTouchOrientation(isHorizontalTouch ? 'vertical' : 'horizontal')}
              >
                {isHorizontalTouch ? '좌우' : '상하'} 넘기기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
