'use client'

import { useNavigationModeStore } from '@/components/ImageViewer/store/navigationMode'
import { useScreenFitStore } from '@/components/ImageViewer/store/screenFit'
import { useTouchOrientationStore } from '@/components/ImageViewer/store/touchOrientation'
import { type Manga } from '@/types/manga'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

import { IconChevronLeft, IconClose, IconMaximize, IconReload } from '../icons/IconImageViewer'
import ImageSlider from './ImageSlider'
import ScrollViewer from './ScrollViewer'
import Slideshow from './Slideshow'
import { useImageIndexStore } from './store/imageIndex'
import { usePageViewStore } from './store/pageView'
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
  const { screenFit, setScreenFit } = useScreenFitStore()
  const { touchOrientation, setTouchOrientation } = useTouchOrientationStore()
  const { pageView, setPageView } = usePageViewStore()
  const correctImageIndex = useImageIndexStore((state) => state.correctImageIndex)
  const setImageIndex = useImageIndexStore((state) => state.setImageIndex)
  const isDoublePage = pageView === 'double'
  const isTouchMode = navMode === 'touch'
  const isWidthFit = screenFit === 'width'
  const isHorizontalTouch = touchOrientation === 'horizontal'
  const router = useRouter()

  useEffect(() => {
    document.documentElement.style.overscrollBehavior = 'none'
    return () => {
      document.documentElement.style.overscrollBehavior = ''
    }
  }, [isTouchMode])

  useEffect(() => {
    return () => {
      setImageIndex(0)
    }
  }, [setImageIndex])

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

  const toggleController = useCallback(() => setShowController((prev) => !prev), [])

  return (
    <div className="relative">
      <div
        aria-expanded={showController}
        className="fixed top-0 left-0 right-0 z-10 bg-background/70 backdrop-blur border-b border-zinc-500 px-safe transition opacity-0 pointer-events-none aria-expanded:opacity-100 aria-expanded:pointer-events-auto"
      >
        <div className="flex gap-2 items-center justify-between p-3 [&_button]:rounded-full [&_button]:active:text-zinc-500 [&_button]:hover:bg-zinc-800 [&_button]:transition [&_button]:p-2 [&_button]:focus:outline outline-zinc-500">
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
        <TouchViewer manga={manga} onClick={toggleController} pageView={pageView} screenFit={screenFit} />
      ) : (
        <ScrollViewer manga={manga} onClick={toggleController} pageView={pageView} screenFit={screenFit} />
      )}

      <div
        aria-expanded={showController}
        className="fixed bottom-0 left-0 right-0 z-10 bg-background/70 backdrop-blur border-t border-zinc-500 px-safe pb-safe transition opacity-0 pointer-events-none aria-expanded:opacity-100 aria-expanded:pointer-events-auto"
      >
        <div className="p-3 grid gap-1.5">
          <ImageSlider maxImageIndex={maxImageIndex} />
          <div className="font-semibold whitespace-nowrap flex-wrap justify-center text-sm flex gap-2 text-background [&_button]:rounded-full [&_button]:bg-zinc-100 [&_button]:px-2 [&_button]:py-1 [&_button]:hover:bg-foreground [&_button]:active:bg-zinc-400 [&_button]:disabled:bg-zinc-400 [&_button]:disabled:text-zinc-500 [&_button]:min-w-20 [&_button]:transition">
            <button onClick={() => setNavMode(isTouchMode ? 'scroll' : 'touch')}>
              {isTouchMode ? '터치' : '스크롤'} 모드
            </button>
            <button
              onClick={() => {
                correctImageIndex()
                setPageView(isDoublePage ? 'single' : 'double')
              }}
            >
              {isDoublePage ? '두 쪽' : '한 쪽'} 보기
            </button>
            <button onClick={() => setScreenFit(screenFit === 'all' ? 'width' : isWidthFit ? 'height' : 'all')}>
              {screenFit === 'all' ? '화면' : isWidthFit ? '가로' : '세로'} 맞춤
            </button>
            {isTouchMode && (
              <>
                <button onClick={() => setTouchOrientation(isHorizontalTouch ? 'vertical' : 'horizontal')}>
                  {isHorizontalTouch ? '좌우' : '상하'} 넘기기
                </button>
                <Slideshow
                  maxImageIndex={maxImageIndex}
                  offset={isDoublePage ? 2 : 1}
                  onIntervalChange={setImageIndex}
                />
              </>
            )}
            {!isTouchMode && (
              <button disabled onClick={() => {}}>
                너비 100%
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
