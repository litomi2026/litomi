'use client'

import useImageNavigation from '@/hook/useImageNavigation'
import { useNavigationModeStore } from '@/store/controller/navigationMode'
import { usePageViewStore } from '@/store/controller/pageView'
import { type Manga } from '@/types/manga'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

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
  const router = useRouter()

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

  function toggleFullScreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => toast.error('전체화면 전환 실패'))
    } else {
      document.exitFullscreen().catch(() => toast.error('전체화면 해제 실패'))
    }
  }

  return (
    <div className="relative">
      {showController && (
        <div className="fixed top-0 left-0 right-0 z-10 bg-black/70 backdrop-blur border-b border-gray-500 px-safe">
          <div className="flex items-center justify-between p-3 [&_button]:rounded-full [&_button]:active:text-gray-500 [&_button]:hover:bg-gray-900">
            <div className="flex gap-1">
              <button aria-label="뒤로가기" className="p-2" onClick={() => router.back()}>
                <svg className="w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
              <button aria-label="창 닫기" className="p-2" onClick={() => window.close()}>
                <svg className="w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                </svg>
              </button>
            </div>
            <h1 className="flex-1 text-center line-clamp-3 font-bold text-white">{title}</h1>
            <div className="flex gap-1">
              <button aria-label="전체화면" className="p-2" onClick={toggleFullScreen}>
                <svg className="w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    d="M4 4h6M4 4v6M20 4h-6M20 4v6M4 20h6M4 20v-6M20 20h-6M20 20v-6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                  />
                </svg>
              </button>
              <button aria-label="새로고침" className="p-2" onClick={() => router.refresh()}>
                <svg
                  className="w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <polyline points="23 4 23 10 17 10"></polyline>
                  <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                </svg>
              </button>
            </div>
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
        <div className="fixed bottom-0 left-0 right-0 z-10 bg-black/70 backdrop-blur border-t border-gray-500 px-safe pb-safe">
          <div className="p-4 grid gap-2">
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
                <div className="mx-auto rounded text-center text-xs">
                  {startPage === endPage ? startPage : `${startPage}-${endPage}`} / {imageCount}
                </div>
              </>
            )}
            <div className="font-medium whitespace-nowrap flex-wrap justify-center text-sm flex gap-2 text-black [&_button]:rounded-full [&_button]:bg-gray-100 [&_button]:px-2 [&_button]:py-1 [&_button]:hover:bg-white [&_button]:active:bg-gray-400 [&_button]:disabled:bg-gray-400 [&_button]:disabled:text-gray-500 [&_button]:min-w-20">
              <button onClick={() => setNavMode(isTouchMode ? 'scroll' : 'touch')}>
                {isTouchMode ? '터치' : '스크롤'} 모드
              </button>
              <button onClick={() => setPageView(isDoublePage ? 'single' : 'double')}>
                {isDoublePage ? '두 쪽' : '한 쪽'} 보기
              </button>
              <button
                disabled={isScrollMode}
                onClick={() => setTouchOrientation(isHorizontalTouch ? 'vertical' : 'horizontal')}
              >
                {isHorizontalTouch ? '좌우' : '상하'} 넘기기
              </button>
              <button disabled onClick={() => setPageView(isDoublePage ? 'single' : 'double')}>
                {isTouchMode ? '세로' : '가로'} 맞춤
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
