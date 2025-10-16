'use client'

import { ArrowLeft, ArrowRight } from 'lucide-react'
import ms from 'ms'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useState } from 'react'

import { useImageWidthStore } from '@/components/ImageViewer/store/imageWidth'
import { useNavigationModeStore } from '@/components/ImageViewer/store/navigationMode'
import { useReadingDirectionStore } from '@/components/ImageViewer/store/readingDirection'
import { useScreenFitStore } from '@/components/ImageViewer/store/screenFit'
import { orientations, useTouchOrientationStore } from '@/components/ImageViewer/store/touchOrientation'
import { type Manga } from '@/types/manga'

import IconChat from '../icons/IconChat'
import { IconChevronLeft } from '../icons/IconImageViewer'
import FullscreenButton from './FullscreenButton'
import ImageSlider from './ImageSlider'
import MangaDetailButton from './MangaDetailButton'
import ReadingProgressSaver from './ReadingProgressSaver'
import ResumeReadingToast from './ResumeReadingToast'
import ShareButton from './ShareButton'
import SlideshowButton from './SlideshowButton'
import { useImageIndexStore } from './store/imageIndex'
import { usePageViewStore } from './store/pageView'
import TouchViewer from './TouchViewer'

const ScrollViewer = dynamic(() => import('./ScrollViewer'))

type Props = {
  manga: Manga
}

export default function ImageViewer({ manga }: Readonly<Props>) {
  const [showController, setShowController] = useState(false)
  const { navMode, setNavMode } = useNavigationModeStore()
  const { screenFit, setScreenFit } = useScreenFitStore()
  const { touchOrientation, setTouchOrientation } = useTouchOrientationStore()
  const { pageView, setPageView } = usePageViewStore()
  const { imageWidth, cycleImageWidth } = useImageWidthStore()
  const { readingDirection, toggleReadingDirection } = useReadingDirectionStore()
  const correctImageIndex = useImageIndexStore((state) => state.correctImageIndex)
  const setImageIndex = useImageIndexStore((state) => state.setImageIndex)
  const toggleController = useCallback(() => setShowController((prev) => !prev), [])
  const router = useRouter()
  const { images = [] } = manga
  const imageCount = images.length
  const maxImageIndex = imageCount - 1
  const isDoublePage = pageView === 'double'
  const isTouchMode = navMode === 'touch'
  const isWidthFit = screenFit === 'width'

  // NOTE: 스크롤 방지
  useEffect(() => {
    document.documentElement.style.overscrollBehavior = 'none'
    document.body.style.overscrollBehavior = 'none'
    return () => {
      document.documentElement.style.overscrollBehavior = ''
      document.body.style.overscrollBehavior = ''
    }
  }, [])

  // NOTE: 뷰어를 벗어나면 페이지 초기화
  useEffect(() => {
    return () => {
      setImageIndex(0)
    }
  }, [setImageIndex])

  // NOTE: 컨트롤러 자동 숨김
  useEffect(() => {
    if (showController) {
      const timer = setTimeout(() => {
        setShowController(false)
      }, ms('10 seconds'))

      return () => clearTimeout(timer)
    }
  }, [showController])

  return (
    <div className="relative">
      <ResumeReadingToast manga={manga} />
      <ReadingProgressSaver mangaId={manga.id} />
      <div
        aria-current={showController}
        className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur border-b border-zinc-500 px-safe transition opacity-0 pointer-events-none
        aria-current:opacity-100 aria-current:pointer-events-auto"
      >
        <div
          className="flex gap-2 items-center justify-between p-3 select-none
          [&_button]:rounded-full [&_button]:active:text-zinc-500 [&_button]:hover:bg-zinc-800 [&_button]:transition [&_button]:p-2
          [&_a]:rounded-full [&_a]:active:text-zinc-500 [&_a]:hover:bg-zinc-800 [&_a]:transition [&_a]:p-2"
        >
          <div className="flex gap-1">
            <button aria-label="뒤로가기" onClick={() => router.back()}>
              <IconChevronLeft className="size-6" />
            </button>
            <FullscreenButton />
          </div>
          <MangaDetailButton manga={manga} />
          <div className="flex gap-1">
            <Link aria-label="리뷰 보기" href={`/manga/${manga.id}/detail`}>
              <IconChat className="size-6" />
            </Link>
            <ShareButton />
          </div>
        </div>
      </div>
      {isTouchMode ? (
        <TouchViewer
          manga={manga}
          onClick={toggleController}
          pageView={pageView}
          readingDirection={readingDirection}
          screenFit={screenFit}
        />
      ) : (
        <ScrollViewer
          manga={manga}
          onClick={toggleController}
          pageView={pageView}
          readingDirection={readingDirection}
          screenFit={screenFit}
        />
      )}
      <div
        aria-current={showController}
        className="fixed bottom-0 left-0 right-0 z-10 bg-background/80 backdrop-blur border-t border-zinc-500 px-safe pb-safe transition opacity-0 pointer-events-none
        aria-current:opacity-100 aria-current:pointer-events-auto"
      >
        <div className="p-3 grid gap-1.5 select-none">
          <ImageSlider maxImageIndex={maxImageIndex} />
          <div
            className="font-semibold whitespace-nowrap flex-wrap justify-center text-sm flex gap-2 text-background 
            [&_button]:rounded-full [&_button]:bg-zinc-100 [&_button]:px-2 [&_button]:py-1 [&_button]:hover:bg-foreground [&_button]:active:bg-zinc-400 [&_button]:disabled:bg-zinc-400 [&_button]:disabled:text-zinc-500 [&_button]:min-w-20 [&_button]:transition"
          >
            <button onClick={() => setNavMode(isTouchMode ? 'scroll' : 'touch')}>
              {isTouchMode ? '터치' : '스크롤'}보기
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
            {isDoublePage && (
              <button className="flex items-center justify-center gap-1" onClick={toggleReadingDirection}>
                좌 {readingDirection === 'ltr' ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}{' '}
                우
              </button>
            )}
            {isTouchMode && (
              <>
                <button
                  onClick={() => {
                    const currentIndex = orientations.indexOf(touchOrientation)
                    const nextIndex = (currentIndex + 1) % orientations.length
                    setTouchOrientation(orientations[nextIndex])
                  }}
                >
                  {touchOrientation === 'horizontal' && '좌우 넘기기'}
                  {touchOrientation === 'vertical' && '상하 넘기기'}
                  {touchOrientation === 'horizontal-reverse' && '우좌 넘기기'}
                  {touchOrientation === 'vertical-reverse' && '하상 넘기기'}
                </button>
                <SlideshowButton
                  maxImageIndex={maxImageIndex}
                  offset={isDoublePage ? 2 : 1}
                  onIntervalChange={setImageIndex}
                />
              </>
            )}
            {!isTouchMode && (screenFit === 'width' || screenFit === 'all') && (
              <button onClick={cycleImageWidth}>너비 {imageWidth}%</button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
