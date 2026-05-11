'use client'

import { ArrowLeft, ArrowRight, Loader2, MessageCircle } from 'lucide-react'
import ms from 'ms'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import BackButton from '@/components/BackButton'
import { type Manga } from '@/types/manga'

import FullscreenButton from './FullscreenButton'
import ImageSlider from './ImageSlider'
import {
  getAutoLowDataNoticeMessage,
  getLowDataPreferenceLabel,
  getNavigatorLowDataSnapshot,
  type LowDataSnapshot,
  resolveLowDataState,
} from './lowData'
import MangaDetailButton from './MangaDetailButton'
import PageViewer from './PageViewer/PageViewer'
import ReadingProgressSaver from './ReadingProgress/ReadingProgressSaver'
import ResumeReadingToast from './ReadingProgress/ResumeReadingToast'
import ShareButton from './ShareButton'
import SlideshowButton from './SlideshowButton'
import { useImageIndexStore } from './store/imageIndex'
import { useLowDataModeStore, useLowDataPreferenceHydrated } from './store/lowDataMode'
import { orientations, useOrientationStore } from './store/orientation'
import { usePageViewStore } from './store/pageView'
import { useReadingDirectionStore } from './store/readingDirection'
import { useScreenFitStore } from './store/screenFit'
import { useViewerModeStore } from './store/viewerMode'
import { useVirtualScrollStore } from './store/virtualizer'
import ThumbnailStrip from './ThumbnailStrip'
import useAutoHideCursor from './useAutoHideCursor'
import ViewControlPanel from './ViewControlPanel'
import { shouldIgnoreViewerGestureTarget } from './viewerGesturePolicy'

const ScrollViewer = dynamic(() => import('./ScrollViewer/ScrollViewer'))

type Props = {
  manga: Manga
}

export default function ImageViewer({ manga }: Readonly<Props>) {
  const [showController, setShowController] = useState(false)
  const [showThumbnails, setShowThumbnails] = useState(false)
  const [showViewControl, setShowViewControl] = useState(false)
  const [lowDataSnapshot, setLowDataSnapshot] = useState<LowDataSnapshot | null>(null)
  const { preference, cyclePreference } = useLowDataModeStore()
  const { viewerMode, setViewerMode } = useViewerModeStore()
  const { screenFit, setScreenFit } = useScreenFitStore()
  const { orientation, setOrientation } = useOrientationStore()
  const { pageView, setPageView } = usePageViewStore()
  const { readingDirection, toggleReadingDirection } = useReadingDirectionStore()
  const correctImageIndex = useImageIndexStore((state) => state.correctImageIndex)
  const setImageIndex = useImageIndexStore((state) => state.setImageIndex)
  const scrollToRow = useVirtualScrollStore((state) => state.scrollToRow)
  const isLowDataPreferenceHydrated = useLowDataPreferenceHydrated()
  const viewControlRef = useRef<HTMLDivElement>(null)

  const { images = [] } = manga
  const thumbnailImages = images.map((image) => image.thumbnail)
  const imageCount = images.length
  const maxImageIndex = imageCount - 1
  const isDoublePage = pageView === 'double'
  const isLowDataReady = isLowDataPreferenceHydrated && lowDataSnapshot !== null
  const isPageMode = viewerMode === 'page'
  const isWidthFit = screenFit === 'width'
  const { enabled: isLowDataMode } = resolveLowDataState(preference, lowDataSnapshot)

  const topButtonClassName =
    'rounded-full active:text-zinc-500 hover:bg-zinc-800 transition p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/70'

  const bottomButtonClassName =
    'rounded-full bg-foreground p-2 py-1 active:bg-zinc-400 disabled:bg-zinc-400 disabled:text-zinc-500 min-w-20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

  const handleIntervalChange = useCallback(
    (index: number) => {
      setImageIndex(index)
      scrollToRow(isDoublePage ? Math.floor(index / 2) : index)
    },
    [setImageIndex, isDoublePage, scrollToRow],
  )

  const { isCursorHidden, registerActivity } = useAutoHideCursor({
    enabled: !showController,
    idleDelayMs: ms('3 seconds'),
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

  // NOTE: 뷰어 진입 시 네트워크 상태를 한 번만 읽고, 자동 모드 안내도 그때만 결정해요
  useEffect(() => {
    if (!isLowDataPreferenceHydrated || lowDataSnapshot) {
      return
    }

    const snapshot = getNavigatorLowDataSnapshot()
    const nextResolvedLowData = resolveLowDataState(preference, snapshot)
    const message = getAutoLowDataNoticeMessage(nextResolvedLowData.reason)

    setLowDataSnapshot(snapshot)

    if (message) {
      toast(message)
    }
  }, [isLowDataPreferenceHydrated, lowDataSnapshot, preference])

  // NOTE: 뷰어를 벗어나면 페이지 초기화
  useEffect(() => {
    return () => {
      setImageIndex(0)
    }
  }, [setImageIndex])

  // NOTE: 뷰어 표면 탭/클릭과 같은 컨트롤 토글을 키보드로도 사용할 수 있게 해요
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const { altKey, ctrlKey, defaultPrevented, key, metaKey, target } = event

      if (defaultPrevented || altKey || ctrlKey || metaKey || document.querySelector('dialog[open]')) {
        return
      }

      if (key === 'Enter' && !shouldIgnoreViewerGestureTarget(target)) {
        event.preventDefault()
        setShowController((prev) => !prev)
        return
      }

      if (key !== 'Escape') {
        return
      }

      if (showViewControl) {
        event.preventDefault()
        setShowViewControl(false)
        return
      }

      if (showThumbnails) {
        event.preventDefault()
        setShowThumbnails(false)
        return
      }

      if (showController) {
        event.preventDefault()
        setShowController(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [showController, showThumbnails, showViewControl])

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
    <section
      aria-keyshortcuts="Enter Escape"
      aria-label="이미지 뷰어"
      className="relative data-[cursor-hidden=true]:cursor-none focus:outline-none"
      data-cursor-hidden={isCursorHidden ? 'true' : 'false'}
      onPointerDown={registerActivity}
      onPointerMove={registerActivity}
      onWheel={registerActivity}
    >
      <ResumeReadingToast manga={manga} />
      <ReadingProgressSaver mangaId={manga.id} />
      <header
        aria-hidden={!showController}
        className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur border-b border-zinc-500 pt-safe px-safe transition opacity-0 pointer-events-none
        data-[visible=true]:opacity-100 data-[visible=true]:pointer-events-auto"
        data-visible={showController ? 'true' : 'false'}
        inert={!showController}
      >
        <div
          aria-label="뷰어 상단 도구"
          className="flex gap-2 items-center justify-between p-3 select-none"
          role="toolbar"
        >
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
              title="리뷰 보기"
            >
              <MessageCircle className="size-6" />
            </Link>
            <ShareButton className={topButtonClassName} manga={manga} />
          </div>
        </div>
      </header>
      {!isLowDataReady ? (
        <output className="flex items-center justify-center h-dvh animate-fade-in">
          <Loader2 aria-hidden="true" className="size-8 animate-spin" />
          <span className="sr-only">이미지 불러오는 중</span>
        </output>
      ) : isPageMode ? (
        <PageViewer
          isLowDataMode={isLowDataMode}
          manga={manga}
          onClick={() => setShowController((prev) => !prev)}
          showController={showController}
        />
      ) : (
        <ScrollViewer isLowDataMode={isLowDataMode} manga={manga} onClick={() => setShowController((prev) => !prev)} />
      )}
      <footer
        aria-hidden={!showController}
        className="fixed bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur border-t border-zinc-500 px-safe pb-safe transition opacity-0 pointer-events-none
        data-[visible=true]:opacity-100 data-[visible=true]:pointer-events-auto"
        data-visible={showController ? 'true' : 'false'}
        inert={!showController}
      >
        <div className="p-3 grid gap-1.5 select-none">
          {showThumbnails && <ThumbnailStrip images={thumbnailImages} mangaId={manga.id} />}
          <ImageSlider maxImageIndex={imageCount} />
          <div
            aria-label="뷰어 보기 설정"
            className="font-semibold whitespace-nowrap flex-wrap justify-center text-sm flex gap-2 text-background"
            role="toolbar"
          >
            <button
              aria-pressed={isPageMode}
              className={bottomButtonClassName}
              onClick={() => setViewerMode(isPageMode ? 'scroll' : 'page')}
              type="button"
            >
              {isPageMode ? '페이지' : '스크롤'}보기
            </button>
            <button
              aria-pressed={isDoublePage}
              className={bottomButtonClassName}
              onClick={() => {
                correctImageIndex()
                setPageView(isDoublePage ? 'single' : 'double')
              }}
              type="button"
            >
              {isDoublePage ? '두 쪽' : '한 쪽'} 보기
            </button>
            <button
              className={bottomButtonClassName}
              onClick={() => setScreenFit(screenFit === 'all' ? 'width' : isWidthFit ? 'height' : 'all')}
              type="button"
            >
              {screenFit === 'all' ? '화면' : isWidthFit ? '가로' : '세로'} 맞춤
            </button>
            {isDoublePage && (
              <button
                className={`${bottomButtonClassName} flex items-center justify-center gap-1`}
                onClick={toggleReadingDirection}
                type="button"
              >
                좌 {readingDirection === 'ltr' ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}{' '}
                우
              </button>
            )}
            {isPageMode && (
              <>
                <button
                  className={bottomButtonClassName}
                  onClick={() => {
                    const currentIndex = orientations.indexOf(orientation)
                    const nextIndex = (currentIndex + 1) % orientations.length
                    setOrientation(orientations[nextIndex])
                  }}
                  type="button"
                >
                  {orientation === 'horizontal' && '좌우 넘기기'}
                  {orientation === 'vertical' && '상하 넘기기'}
                  {orientation === 'horizontal-reverse' && '우좌 넘기기'}
                  {orientation === 'vertical-reverse' && '하상 넘기기'}
                </button>
              </>
            )}
            {!isPageMode && (
              <div className="relative" ref={viewControlRef}>
                <button
                  aria-expanded={showViewControl}
                  className={`${bottomButtonClassName} flex items-center justify-center gap-1`}
                  onClick={() => setShowViewControl((prev) => !prev)}
                  type="button"
                >
                  보기 조절
                </button>
                {showViewControl && <ViewControlPanel />}
              </div>
            )}
            <SlideshowButton
              className={bottomButtonClassName}
              maxImageIndex={maxImageIndex}
              offset={isDoublePage ? 2 : 1}
              onIntervalChange={handleIntervalChange}
            />
            <button
              aria-expanded={showThumbnails}
              className={`${bottomButtonClassName} flex items-center justify-center gap-1`}
              onClick={() => setShowThumbnails((prev) => !prev)}
              title="미리보기"
              type="button"
            >
              미리보기
            </button>
            <button className={bottomButtonClassName} onClick={cyclePreference} type="button">
              {getLowDataPreferenceLabel(preference)}
            </button>
          </div>
        </div>
      </footer>
    </section>
  )
}
