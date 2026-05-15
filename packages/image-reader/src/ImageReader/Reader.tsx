'use client'

import { Loader2 } from 'lucide-react'
import ms from 'ms'
import { type ReactNode, useEffect, useState } from 'react'
import { toast } from 'sonner'

import ReaderControls from './components/ReaderControls'
import useAutoHideCursor from './hooks/useAutoHideCursor'
import usePageSearchParamSync from './hooks/usePageSearchParamSync'
import {
  getAutoLowDataNoticeMessage,
  getNavigatorLowDataSnapshot,
  type LowDataSnapshot,
  resolveLowDataState,
} from './model/lowData'
import { createReaderLayout, type ReaderPage, type ReaderPageRenderer } from './model/readerLayout'
import { shouldIgnoreViewerGestureTarget } from './model/viewerGesturePolicy'
import ReadingProgressTracker, {
  type ReadingProgress,
  type ReadingProgressSaveOptions,
} from './reading-progress/ReadingProgressTracker'
import ResumeReadingToast from './reading-progress/ResumeReadingToast'
import { ReaderProvider, useReaderSessionStore, useReaderStore } from './state/readerStore'
import PagedReaderView from './views/paged/PagedReaderView'
import ScrollReaderView from './views/scroll/ScrollReaderView'

export type ReaderProps<TPage extends ReaderPage> = {
  header?: ReactNode
  pageSearchParam?: string
  pages: readonly TPage[]
  persistenceKey?: string
  readingProgress?: ReadingProgressOptions
  renderPage: ReaderPageRenderer<TPage>
  renderThumbnail: ReaderPageRenderer<TPage>
}

type ReadingProgressOptions = {
  lastReadablePageNumber?: number
  onChange: (progress: ReadingProgress) => void
  onSave?: (progress: ReadingProgress, options?: ReadingProgressSaveOptions) => Promise<void> | void
}

export default function Reader<TPage extends ReaderPage>({ persistenceKey, ...props }: ReaderProps<TPage>) {
  return (
    <ReaderProvider persistenceKey={persistenceKey}>
      <ReaderContent {...props} />
    </ReaderProvider>
  )
}

function ReaderContent<TPage extends ReaderPage>({
  header,
  pageSearchParam = 'page',
  pages,
  readingProgress,
  renderPage,
  renderThumbnail,
}: Omit<ReaderProps<TPage>, 'persistenceKey'>) {
  const [areControlsVisible, setAreControlsVisible] = useState(false)
  const [lowDataSnapshot, setLowDataSnapshot] = useState<LowDataSnapshot | null>(null)
  const doublePageAnchorIndex = useReaderStore((state) => state.doublePageAnchorIndex)
  const isLowDataHydrated = useReaderStore((state) => state.isStorageHydrated)
  const lowData = useReaderSessionStore((state) => state.lowData)
  const pageView = useReaderStore((state) => state.pageView)
  const viewerMode = useReaderStore((state) => state.viewerMode)
  const resetPageIndex = useReaderStore((state) => state.resetPageIndex)

  const readerLayout = createReaderLayout(pages, { doublePageAnchorIndex, pageView })
  const maxPageIndex = Math.max(0, pages.length - 1)
  const isLowDataReady = isLowDataHydrated && lowDataSnapshot !== null
  const isPageMode = viewerMode === 'page'
  const { enabled } = resolveLowDataState(lowData, lowDataSnapshot)

  const { isCursorHidden, registerActivity } = useAutoHideCursor({
    enabled: !areControlsVisible,
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
        setAreControlsVisible((prev) => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <section
      aria-keyshortcuts="Enter Escape"
      className="relative data-[cursor-hidden=true]:cursor-none focus:outline-none"
      data-cursor-hidden={isCursorHidden ? 'true' : 'false'}
      onPointerDown={registerActivity}
      onPointerMove={registerActivity}
      onWheel={registerActivity}
    >
      {readingProgress && (
        <>
          <ResumeReadingToast
            lastReadablePageNumber={readingProgress.lastReadablePageNumber}
            maxPageIndex={maxPageIndex}
            readerLayout={readerLayout}
          />
          <ReadingProgressTracker
            onChange={readingProgress.onChange}
            onSave={readingProgress.onSave}
            readerLayout={readerLayout}
          />
        </>
      )}
      {header && (
        <header
          aria-hidden={!areControlsVisible}
          className="fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur border-b border-zinc-500 pt-safe px-safe transition opacity-0 pointer-events-none
            data-[visible=true]:opacity-100 data-[visible=true]:pointer-events-auto"
          data-visible={areControlsVisible ? 'true' : 'false'}
          inert={!areControlsVisible}
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
        <PagedReaderView
          isLowDataMode={enabled}
          onClick={() => setAreControlsVisible((prev) => !prev)}
          pages={pages}
          readerLayout={readerLayout}
          renderPage={renderPage}
          showTouchAreaOverlay={areControlsVisible}
        />
      ) : (
        <ScrollReaderView
          isLowDataMode={enabled}
          onClick={() => setAreControlsVisible((prev) => !prev)}
          readerLayout={readerLayout}
          renderPage={renderPage}
        />
      )}
      <ReaderControls
        isVisible={areControlsVisible}
        onRequestClose={() => setAreControlsVisible(false)}
        pages={pages}
        readerLayout={readerLayout}
        renderThumbnail={renderThumbnail}
      />
    </section>
  )
}
