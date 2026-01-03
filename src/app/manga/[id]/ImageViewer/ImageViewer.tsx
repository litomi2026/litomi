'use client'

import { ArrowLeft, ArrowRight, MessageCircle } from 'lucide-react'
import ms from 'ms'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import BackButton from '@/components/BackButton'
import { type Manga } from '@/types/manga'

import FullscreenButton from './FullscreenButton'
import ImageSlider from './ImageSlider'
import MangaDetailButton from './MangaDetailButton'
import ReadingProgressSaver from './ReadingProgressSaver'
import ResumeReadingToast from './ResumeReadingToast'
import ShareButton from './ShareButton'
import SlideshowButton from './SlideshowButton'
import { useImageIndexStore } from './store/imageIndex'
import { useNavigationModeStore } from './store/navigationMode'
import { usePageViewStore } from './store/pageView'
import { useReadingDirectionStore } from './store/readingDirection'
import { useScreenFitStore } from './store/screenFit'
import { orientations, useTouchOrientationStore } from './store/touchOrientation'
import { useVirtualScrollStore } from './store/virtualizer'
import ThumbnailStrip from './ThumbnailStrip'
import TouchViewer from './TouchViewer'
import useAutoHideCursor from './useAutoHideCursor'
import ViewControlPanel from './ViewControlPanel'

const ScrollViewer = dynamic(() => import('./ScrollViewer'))

type Props = {
  manga: Manga
}

export default function ImageViewer({ manga }: Readonly<Props>) {
  const [showController, setShowController] = useState(false)
  const [showThumbnails, setShowThumbnails] = useState(false)
  const [showViewControl, setShowViewControl] = useState(false)
  const viewControlRef = useRef<HTMLDivElement>(null)
  const { navMode, setNavMode } = useNavigationModeStore()
  const { screenFit, setScreenFit } = useScreenFitStore()
  const { touchOrientation, setTouchOrientation } = useTouchOrientationStore()
  const { pageView, setPageView } = usePageViewStore()
  const { readingDirection, toggleReadingDirection } = useReadingDirectionStore()
  const correctImageIndex = useImageIndexStore((state) => state.correctImageIndex)
  const setImageIndex = useImageIndexStore((state) => state.setImageIndex)
  const scrollToRow = useVirtualScrollStore((state) => state.scrollToRow)
  const toggleController = useCallback(() => setShowController((prev) => !prev), [])
  const { images = [] } = manga
  const thumbnailImages = images.map((image) => image.thumbnail)
  const hasThumbnails = thumbnailImages.filter(Boolean).length > 0
  const imageCount = images.length
  const maxImageIndex = imageCount - 1
  const isDoublePage = pageView === 'double'
  const isTouchMode = navMode === 'touch'
  const isWidthFit = screenFit === 'width'

  const topButtonClassName = 'rounded-full active:text-zinc-500 hover:bg-zinc-800 transition p-2'

  const bottomButtonClassName =
    'rounded-full bg-foreground p-2 py-1 active:bg-zinc-400 disabled:bg-zinc-400 disabled:text-zinc-500 min-w-20 transition'

  const handleIntervalChange = useCallback(
    (index: number) => {
      setImageIndex(index)
      scrollToRow(isDoublePage ? Math.floor(index / 2) : index)
    },
    [setImageIndex, isDoublePage, scrollToRow],
  )

  const { isCursorHidden, registerActivity } = useAutoHideCursor({
    enabled: !showController,
    idleDelayMs: ms('5 seconds'),
  })

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

  // NOTE: 컨트롤 팝업 외부 클릭 시 닫기
  useEffect(() => {
    if (!showViewControl) {
      return
    }

    function handleClickOutside(e: MouseEvent) {
      if (viewControlRef.current && !viewControlRef.current.contains(e.target as Node)) {
        setShowViewControl(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [showViewControl])

  return (
    <div
      className="relative data-[cursor-hidden=true]:cursor-none"
      data-cursor-hidden={isCursorHidden ? 'true' : 'false'}
      onPointerDown={registerActivity}
      onPointerMove={registerActivity}
      onWheel={registerActivity}
    >
      <ResumeReadingToast manga={manga} />
      <ReadingProgressSaver mangaId={manga.id} />
      <div
        aria-current={showController}
        className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur border-b border-zinc-500 px-safe transition opacity-0 pointer-events-none
        aria-current:opacity-100 aria-current:pointer-events-auto"
      >
        <div className="flex gap-2 items-center justify-between p-3 select-none">
          <div className="flex gap-1">
            <BackButton className={topButtonClassName} fallbackUrl="/" />
            <FullscreenButton className={topButtonClassName} />
          </div>
          <MangaDetailButton className={`${topButtonClassName} hover:underline`} manga={manga} />
          <div className="flex gap-1">
            <Link
              aria-label="리뷰 보기"
              className={topButtonClassName}
              href={`/manga/${manga.id}/detail`}
              prefetch={false}
            >
              <MessageCircle className="size-6" />
            </Link>
            <ShareButton className={topButtonClassName} manga={manga} />
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
          showController={showController}
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
        className="fixed bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur border-t border-zinc-500 px-safe pb-safe transition opacity-0 pointer-events-none
        aria-current:opacity-100 aria-current:pointer-events-auto"
      >
        <div className="p-3 grid gap-1.5 select-none">
          {showThumbnails && hasThumbnails && <ThumbnailStrip images={thumbnailImages} mangaId={manga.id} />}
          <ImageSlider maxImageIndex={imageCount} />
          <div className="font-semibold whitespace-nowrap flex-wrap justify-center text-sm flex gap-2 text-background">
            <button className={bottomButtonClassName} onClick={() => setNavMode(isTouchMode ? 'scroll' : 'touch')}>
              {isTouchMode ? '터치' : '스크롤'}보기
            </button>
            <button
              className={bottomButtonClassName}
              onClick={() => {
                correctImageIndex()
                setPageView(isDoublePage ? 'single' : 'double')
              }}
            >
              {isDoublePage ? '두 쪽' : '한 쪽'} 보기
            </button>
            <button
              className={bottomButtonClassName}
              onClick={() => setScreenFit(screenFit === 'all' ? 'width' : isWidthFit ? 'height' : 'all')}
            >
              {screenFit === 'all' ? '화면' : isWidthFit ? '가로' : '세로'} 맞춤
            </button>
            {isDoublePage && (
              <button
                className={`${bottomButtonClassName} flex items-center justify-center gap-1`}
                onClick={toggleReadingDirection}
              >
                좌 {readingDirection === 'ltr' ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}{' '}
                우
              </button>
            )}
            {isTouchMode && (
              <>
                <button
                  className={bottomButtonClassName}
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
              </>
            )}
            {!isTouchMode && (
              <div className="relative" ref={viewControlRef}>
                <button
                  className={`${bottomButtonClassName} flex items-center justify-center gap-1`}
                  onClick={() => setShowViewControl((prev) => !prev)}
                >
                  보기 조절
                </button>
                {showViewControl && <ViewControlPanel screenFit={screenFit} />}
              </div>
            )}
            <SlideshowButton
              className={bottomButtonClassName}
              maxImageIndex={maxImageIndex}
              offset={isDoublePage ? 2 : 1}
              onIntervalChange={handleIntervalChange}
            />
            <button
              aria-disabled={!hasThumbnails}
              className={`${bottomButtonClassName} flex items-center justify-center gap-1 aria-disabled:opacity-50 aria-disabled:cursor-not-allowed`}
              onClick={() => hasThumbnails && setShowThumbnails((prev) => !prev)}
              title={hasThumbnails ? '미리보기' : '썸네일이 없어요'}
            >
              미리보기
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
