'use client'

import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react'
import ms from 'ms'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import ImageSlider from './ImageSlider'
import {
  getAutoLowDataNoticeMessage,
  getLowDataLabel,
  getNavigatorLowDataSnapshot,
  type LowDataSnapshot,
  resolveLowDataState,
} from './lowData'
import PageViewer from './PageViewer/PageViewer'
import { createReaderLayout, type ReaderLayout, type ReaderPage, type ReaderPageRenderer } from './readerPages'
import ScrollViewer from './ScrollViewer/ScrollViewer'
import SlideshowButton from './SlideshowButton'
import { orientations, ReaderProvider, useReaderSessionStore, useReaderStore } from './store/reader'
import ThumbnailStrip from './ThumbnailStrip'
import useAutoHideCursor from './useAutoHideCursor'
import usePageSearchParamSync from './usePageSearchParamSync'
import ViewControlPanel from './ViewControlPanel'
import { shouldIgnoreViewerGestureTarget } from './viewerGesturePolicy'

const BOTTOM_BUTTON_CLASS_NAME =
  'rounded-full bg-foreground p-2 py-1 active:bg-zinc-400 disabled:bg-zinc-400 disabled:text-zinc-500 min-w-20 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-background'

type Props<TPage extends ReaderPage> = {
  children?: (context: ReaderContext<TPage>) => ReactNode
  header?: ReactNode
  pageSearchParam: string
  pages: readonly TPage[]
  persistenceKey?: string
  renderPage: ReaderPageRenderer<TPage>
  renderThumbnail: ReaderPageRenderer<TPage>
}

type ReaderContext<TPage extends ReaderPage> = {
  readerLayout: ReaderLayout<TPage>
  readablePageCount: number
}

export default function ImageReader<TPage extends ReaderPage>({ persistenceKey, ...props }: Props<TPage>) {
  return (
    <ReaderProvider persistenceKey={persistenceKey}>
      <ReaderContent {...props} />
    </ReaderProvider>
  )
}

function ReaderContent<TPage extends ReaderPage>({
  children,
  header,
  pageSearchParam,
  pages,
  renderPage,
  renderThumbnail,
}: Omit<Props<TPage>, 'persistenceKey'>) {
  const [showController, setShowController] = useState(false)
  const [showThumbnails, setShowThumbnails] = useState(false)
  const [showViewControl, setShowViewControl] = useState(false)
  const [lowDataSnapshot, setLowDataSnapshot] = useState<LowDataSnapshot | null>(null)
  const isLowDataHydrated = useReaderStore((state) => state.isStorageHydrated)
  const lowData = useReaderSessionStore((state) => state.lowData)
  const orientation = useReaderStore((state) => state.orientation)
  const pageView = useReaderStore((state) => state.pageView)
  const readingDirection = useReaderStore((state) => state.readingDirection)
  const screenFit = useReaderStore((state) => state.screenFit)
  const viewerMode = useReaderStore((state) => state.viewerMode)
  const cycleLowData = useReaderSessionStore((state) => state.cycleLowData)
  const resetPageIndex = useReaderStore((state) => state.resetPageIndex)
  const setViewerMode = useReaderStore((state) => state.setViewerMode)
  const setScreenFit = useReaderStore((state) => state.setScreenFit)
  const setOrientation = useReaderStore((state) => state.setOrientation)
  const setPageView = useReaderStore((state) => state.setPageView)
  const toggleReadingDirection = useReaderStore((state) => state.toggleReadingDirection)
  const viewControlRef = useRef<HTMLDivElement>(null)

  const readerLayout = createReaderLayout(pages, { pageView })
  const { readablePageCount } = readerLayout
  const maxPageIndex = Math.max(0, pages.length - 1)
  const isDoublePage = pageView === 'double'
  const isLowDataReady = isLowDataHydrated && lowDataSnapshot !== null
  const isPageMode = viewerMode === 'page'
  const isWidthFit = screenFit === 'width'
  const { enabled: isLowDataMode } = resolveLowDataState(lowData, lowDataSnapshot)

  const { isCursorHidden, registerActivity } = useAutoHideCursor({
    enabled: !showController,
    idleDelayMs: ms('3 seconds'),
  })

  usePageSearchParamSync({
    enabled: isLowDataReady,
    getScrollRowIndex: (pageIndex) => readerLayout.spreadIndexByPageIndex[pageIndex] ?? pageIndex,
    maxIndex: maxPageIndex,
    pageSearchParam,
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
    if (!isLowDataHydrated || lowDataSnapshot) {
      return
    }

    const snapshot = getNavigatorLowDataSnapshot()
    const nextResolvedLowData = resolveLowDataState(lowData, snapshot)
    const message = getAutoLowDataNoticeMessage(nextResolvedLowData.reason)

    setLowDataSnapshot(snapshot)

    if (message) {
      toast(message)
    }
  }, [isLowDataHydrated, lowDataSnapshot, lowData])

  // NOTE: 뷰어를 벗어나면 페이지 초기화
  useEffect(() => {
    return () => {
      resetPageIndex()
    }
  }, [resetPageIndex])

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
      className="relative data-[cursor-hidden=true]:cursor-none focus:outline-none"
      data-cursor-hidden={isCursorHidden ? 'true' : 'false'}
      onPointerDown={registerActivity}
      onPointerMove={registerActivity}
      onWheel={registerActivity}
    >
      {children?.({ readerLayout, readablePageCount })}
      {header && (
        <header
          aria-hidden={!showController}
          className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur border-b border-zinc-500 pt-safe px-safe transition opacity-0 pointer-events-none
            data-[visible=true]:opacity-100 data-[visible=true]:pointer-events-auto"
          data-visible={showController ? 'true' : 'false'}
          inert={!showController}
        >
          {header}
        </header>
      )}
      {!isLowDataReady ? (
        <output className="flex items-center justify-center h-dvh animate-fade-in">
          <Loader2 aria-hidden="true" className="size-8 animate-spin" />
          <span className="sr-only">이미지 불러오는 중</span>
        </output>
      ) : isPageMode ? (
        <PageViewer
          isLowDataMode={isLowDataMode}
          onClick={() => setShowController((prev) => !prev)}
          pages={pages}
          readerLayout={readerLayout}
          renderPage={renderPage}
          showTouchAreaOverlay={showController}
        />
      ) : (
        <ScrollViewer
          isLowDataMode={isLowDataMode}
          onClick={() => setShowController((prev) => !prev)}
          readerLayout={readerLayout}
          renderPage={renderPage}
        />
      )}
      <footer
        aria-hidden={!showController}
        className="fixed bottom-0 left-0 right-0 z-20 bg-background/80 backdrop-blur border-t border-zinc-500 px-safe pb-safe transition opacity-0 pointer-events-none
        data-[visible=true]:opacity-100 data-[visible=true]:pointer-events-auto"
        data-visible={showController ? 'true' : 'false'}
        inert={!showController}
      >
        <div className="p-3 grid gap-1.5 select-none">
          {showThumbnails && (
            <ThumbnailStrip pages={pages} readerLayout={readerLayout} renderThumbnail={renderThumbnail} />
          )}
          <ImageSlider maxPageIndex={maxPageIndex} readerLayout={readerLayout} />
          <div
            aria-label="뷰어 보기 설정"
            className="font-semibold whitespace-nowrap flex-wrap justify-center text-sm flex gap-2 text-background"
            role="toolbar"
          >
            <button
              aria-pressed={isPageMode}
              className={BOTTOM_BUTTON_CLASS_NAME}
              onClick={() => setViewerMode(isPageMode ? 'scroll' : 'page')}
              type="button"
            >
              {isPageMode ? '페이지' : '스크롤'}보기
            </button>
            <button
              aria-pressed={isDoublePage}
              className={BOTTOM_BUTTON_CLASS_NAME}
              onClick={() => setPageView(isDoublePage ? 'single' : 'double')}
              type="button"
            >
              {isDoublePage ? '두 쪽' : '한 쪽'} 보기
            </button>
            <button
              className={BOTTOM_BUTTON_CLASS_NAME}
              onClick={() => setScreenFit(screenFit === 'all' ? 'width' : isWidthFit ? 'height' : 'all')}
              type="button"
            >
              {screenFit === 'all' ? '화면' : isWidthFit ? '가로' : '세로'} 맞춤
            </button>
            {isDoublePage && (
              <button
                className={`${BOTTOM_BUTTON_CLASS_NAME} flex items-center justify-center gap-1`}
                onClick={toggleReadingDirection}
                type="button"
              >
                좌 {readingDirection === 'ltr' ? <ArrowRight className="size-4" /> : <ArrowLeft className="size-4" />}{' '}
                우
              </button>
            )}
            {isPageMode && (
              <button
                className={BOTTOM_BUTTON_CLASS_NAME}
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
            )}
            {!isPageMode && (
              <div className="relative" ref={viewControlRef}>
                <button
                  aria-expanded={showViewControl}
                  className={`${BOTTOM_BUTTON_CLASS_NAME} flex items-center justify-center gap-1`}
                  onClick={() => setShowViewControl((prev) => !prev)}
                  type="button"
                >
                  보기 조절
                </button>
                {showViewControl && <ViewControlPanel />}
              </div>
            )}
            <SlideshowButton
              className={BOTTOM_BUTTON_CLASS_NAME}
              maxPageIndex={maxPageIndex}
              readerLayout={readerLayout}
            />
            <button
              aria-expanded={showThumbnails}
              className={`${BOTTOM_BUTTON_CLASS_NAME} flex items-center justify-center gap-1`}
              onClick={() => setShowThumbnails((prev) => !prev)}
              title="미리보기"
              type="button"
            >
              미리보기
            </button>
            <button className={BOTTOM_BUTTON_CLASS_NAME} onClick={cycleLowData} type="button">
              {getLowDataLabel(lowData)}
            </button>
          </div>
        </div>
      </footer>
    </section>
  )
}
