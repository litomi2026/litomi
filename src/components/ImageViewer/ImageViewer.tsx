'use client'

import useImageNavigation from '@/hook/useImageNavigation'
import { useNavigationModeStore } from '@/store/controller/navigationMode'
import { usePageViewStore } from '@/store/controller/pageView'
import { useScreenFitStore } from '@/store/controller/screenFit'
import { useTouchOrientationStore } from '@/store/controller/touchOrientation'
import { type Manga } from '@/types/manga'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { IconChevronLeft, IconClose, IconMaximize, IconReload } from '../icons/IconImageViewer'
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
  const { screenFit, setScreenFit } = useScreenFitStore()
  const { touchOrientation, setTouchOrientation } = useTouchOrientationStore()
  const isTouchMode = navMode === 'touch'
  const isDoublePage = pageView === 'double'
  const isWidthFit = screenFit === 'width'
  const isHorizontalTouch = touchOrientation === 'horizontal'
  const router = useRouter()

  const { currentIndex, setCurrentIndex, prevPage, nextPage } = useImageNavigation({
    enabled: isTouchMode,
    maxIndex: maxImageIndex,
    offset: isDoublePage ? 2 : 1,
  })

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
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen()
      } else {
        toast.error('이 브라우저는 전체화면 기능을 지원하지 않습니다.')
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }

  return (
    <div className="relative">
      <div
        aria-hidden={!showController}
        className="fixed top-0 left-0 right-0 z-10 bg-background/70 backdrop-blur border-b border-gray-500 px-safe transition aria-hidden:opacity-0 aria-hidden:pointer-events-none"
      >
        <div className="flex gap-2 items-center justify-between p-3 [&_button]:rounded-full [&_button]:active:text-gray-500 [&_button]:hover:bg-gray-800 [&_button]:transition [&_button]:p-2 [&_button]:focus:outline outline-gray-500">
          <div className="flex gap-1">
            <button aria-label="뒤로가기" onClick={() => router.back()}>
              <IconChevronLeft className="w-6" />
            </button>
            <button aria-label="창 닫기" onClick={() => window.close()}>
              <IconClose className="w-6" />
            </button>
          </div>
          <h1 className="flex-1 text-center line-clamp-2 font-bold text-foreground">{title}</h1>
          <div className="flex gap-1">
            <button aria-label="새로고침" onClick={() => window.location.reload()}>
              <IconReload className="w-6" />
            </button>
            <button aria-label="전체화면" onClick={toggleFullScreen}>
              <IconMaximize className="w-6" />
            </button>
          </div>
        </div>
      </div>

      {isTouchMode ? (
        <TouchViewer
          currentIndex={currentIndex}
          manga={manga}
          onClick={() => setShowController((prev) => !prev)}
          onNavigate={(direction) => (direction === 'prev' ? prevPage() : nextPage())}
        />
      ) : (
        <ScrollViewer manga={manga} onClick={() => setShowController((prev) => !prev)} />
      )}

      <div
        aria-hidden={!showController}
        className="fixed bottom-0 left-0 right-0 z-10 bg-background/70 backdrop-blur border-t border-gray-500 px-safe pb-safe transition aria-hidden:opacity-0 aria-hidden:pointer-events-none"
      >
        <div className="p-3 grid gap-1.5">
          {isTouchMode && (
            <>
              <div className="px-3">
                <Slider
                  className="h-6"
                  max={maxImageIndex}
                  onValueCommit={(value) => setCurrentIndex(value)}
                  value={currentIndex}
                />
              </div>
              <div className="mx-auto rounded text-center text-xs">
                {startPage === endPage ? startPage : `${startPage}-${endPage}`} / {imageCount}
              </div>
            </>
          )}
          <div className="font-semibold whitespace-nowrap flex-wrap justify-center text-sm flex gap-2 text-background [&_button]:rounded-full [&_button]:bg-gray-100 [&_button]:px-2 [&_button]:py-1 [&_button]:hover:bg-foreground [&_button]:active:bg-gray-400 [&_button]:disabled:bg-gray-400 [&_button]:disabled:text-gray-500 [&_button]:min-w-20 [&_button]:transition">
            <button onClick={() => setNavMode(isTouchMode ? 'scroll' : 'touch')}>
              {isTouchMode ? '터치' : '스크롤'} 모드
            </button>
            <button
              onClick={() => {
                setCurrentIndex(Math.max(0, currentIndex))
                setPageView(isDoublePage ? 'single' : 'double')
              }}
            >
              {isDoublePage ? '두 쪽' : '한 쪽'} 보기
            </button>
            <button onClick={() => setScreenFit(screenFit === 'all' ? 'width' : isWidthFit ? 'height' : 'all')}>
              {screenFit === 'all' ? '화면' : isWidthFit ? '가로' : '세로'} 맞춤
            </button>
            {isTouchMode ? (
              <button onClick={() => setTouchOrientation(isHorizontalTouch ? 'vertical' : 'horizontal')}>
                {isHorizontalTouch ? '좌우' : '상하'} 넘기기
              </button>
            ) : (
              <button disabled onClick={() => setTouchOrientation(isHorizontalTouch ? 'vertical' : 'horizontal')}>
                너비 100%
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
