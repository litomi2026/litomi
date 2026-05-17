'use client'

import type { ReaderLocale, ReaderMessageOverrides } from '#reader/model/readerMessages'
import type { ReaderNoticeHandler } from '#reader/model/readerNotice'

import ReaderControls from '#reader/components/ReaderControls'
import useAutoHideCursor from '#reader/hooks/useAutoHideCursor'
import usePageSearchParamSync from '#reader/hooks/usePageSearchParamSync'
import { getNavigatorLowDataSnapshot, type LowDataSnapshot, resolveLowDataState } from '#reader/model/lowData'
import { createReaderLayout, type ReaderPage, type ReaderPageRenderer } from '#reader/model/readerLayout'
import { shouldIgnoreViewerGestureTarget } from '#reader/model/viewerGesturePolicy'
import { ReaderRuntimeProvider, useReaderMessages, useReaderNoticeHandler } from '#reader/readerRuntime'
import ReadingProgressTracker, {
  type ReadingProgress,
  type ReadingProgressSaveOptions,
} from '#reader/reading-progress/ReadingProgressTracker'
import ResumeReadingNotice from '#reader/reading-progress/ResumeReadingNotice'
import { ReaderProvider, useReaderSessionStore, useReaderStore } from '#reader/state/readerStore'
import PagedReaderView from '#reader/views/paged/PagedReaderView'
import ScrollReaderView from '#reader/views/scroll/ScrollReaderView'
import { Loader2 } from 'lucide-react'
import ms from 'ms'
import { type ReactNode, useEffect, useState } from 'react'
import { twMerge } from 'tailwind-merge'

export type ReaderProps<TPage extends ReaderPage> = {
  header?: ReactNode
  locale?: ReaderLocale
  messages?: ReaderMessageOverrides
  onNotice?: ReaderNoticeHandler
  pageSearchParam?: string
  pages: readonly TPage[]
  persistenceKey?: string
  readingProgress?: ReadingProgressOptions
  renderPage: ReaderPageRenderer<TPage>
  renderThumbnail: ReaderPageRenderer<TPage>
}

type ReadingProgressOptions = {
  lastReadablePageNumber?: number | null
  onChange: (progress: ReadingProgress) => void
  onSave?: (progress: ReadingProgress, options?: ReadingProgressSaveOptions) => Promise<void> | void
}

export default function Reader<TPage extends ReaderPage>({
  locale = 'ko',
  messages,
  onNotice,
  persistenceKey,
  ...props
}: ReaderProps<TPage>) {
  return (
    <ReaderRuntimeProvider locale={locale} messages={messages} onNotice={onNotice}>
      <ReaderProvider persistenceKey={persistenceKey}>
        <ReaderContent {...props} />
      </ReaderProvider>
    </ReaderRuntimeProvider>
  )
}

function ReaderContent<TPage extends ReaderPage>({
  header,
  pageSearchParam = 'page',
  pages,
  readingProgress,
  renderPage,
  renderThumbnail,
}: Omit<ReaderProps<TPage>, 'locale' | 'messages' | 'onNotice' | 'persistenceKey'>) {
  const [areControlsVisible, setAreControlsVisible] = useState(false)
  const [lowDataSnapshot, setLowDataSnapshot] = useState<LowDataSnapshot | null>(null)
  const doublePageAnchorIndex = useReaderStore((state) => state.doublePageAnchorIndex)
  const isLowDataHydrated = useReaderStore((state) => state.isStorageHydrated)
  const lowData = useReaderSessionStore((state) => state.lowData)
  const pageView = useReaderStore((state) => state.pageView)
  const viewerMode = useReaderStore((state) => state.viewerMode)
  const resetPageIndex = useReaderStore((state) => state.resetPageIndex)
  const messages = useReaderMessages()
  const onNotice = useReaderNoticeHandler()

  const readerLayout = createReaderLayout(pages, { doublePageAnchorIndex, pageView })
  const maxPageIndex = Math.max(0, pages.length - 1)
  const isLowDataReady = isLowDataHydrated && lowDataSnapshot !== null
  const isPageMode = viewerMode === 'page'
  const { enabled } = resolveLowDataState(lowData, lowDataSnapshot)

  const { isCursorHidden, registerActivity } = useAutoHideCursor({
    enabled: !areControlsVisible,
    idleDelayMs: ms('3 seconds'),
  })

  const isInitialPageSynced = usePageSearchParamSync({
    enabled: isLowDataReady,
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

    setLowDataSnapshot(snapshot)

    if (nextResolvedLowData.reason === 'auto-save-data') {
      onNotice?.({
        code: 'low-data-auto-save-data',
        id: 'reader:low-data:auto-save-data',
        message: messages.lowDataAutoSaveDataNotice,
        severity: 'info',
      })
    }

    if (nextResolvedLowData.reason === 'auto-slow-network') {
      onNotice?.({
        code: 'low-data-auto-slow-network',
        id: 'reader:low-data:auto-slow-network',
        message: messages.lowDataAutoSlowNetworkNotice,
        severity: 'info',
      })
    }
  }, [isLowDataHydrated, lowDataSnapshot, lowData, messages, onNotice])

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
      {readingProgress && isInitialPageSynced && (
        <>
          <ResumeReadingNotice
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
          className={twMerge(
            'fixed top-0 left-0 right-0 z-20 bg-background/80 backdrop-blur border-b border-zinc-500 pt-safe px-safe transition opacity-0 pointer-events-none',
            'data-[visible=true]:opacity-100 data-[visible=true]:pointer-events-auto',
          )}
          data-visible={areControlsVisible ? 'true' : 'false'}
          inert={!areControlsVisible}
        >
          {header}
        </header>
      )}
      {!isLowDataReady ? (
        <output className="flex items-center justify-center h-dvh animate-fade-in">
          <Loader2 aria-hidden="true" className="size-8 animate-spin" />
          <span className="sr-only">{messages.loadingImages}</span>
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
