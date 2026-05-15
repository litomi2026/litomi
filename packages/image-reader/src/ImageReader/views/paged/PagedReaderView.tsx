'use client'

import { Loader2 } from 'lucide-react'
import { Fragment } from 'react'

import type { ReaderLayout, ReaderPage, ReaderPageRenderer } from '../../model/readerLayout'

import { NATIVE_GESTURE_BLOCK_CSS } from '../../model/viewerGesturePolicy'
import { type ScreenFit, useReaderSessionStore, useReaderStore } from '../../state/readerStore'
import useViewerPointerGestures from './gestures/useViewerPointerGestures'
import usePagedReaderViewScrollRestoration from './hooks/usePagedReaderViewScrollRestoration'
import usePagedReaderViewWheelNavigation from './hooks/usePagedReaderViewWheelNavigation'
import usePagedReaderViewZoom from './hooks/usePagedReaderViewZoom'
import usePageNavigation from './hooks/usePageNavigation'

const IMAGE_FETCH_PRIORITY_THRESHOLD = 2
const PAGED_READER_VIEW_WINDOW_SIZE = 6

const screenFitContentStyle: Record<ScreenFit, string> = {
  width:
    'flex justify-center items-center [&_li]:w-fit [&_li]:max-w-full [&_li]:h-full [&_picture]:contents [&_img]:my-auto [&_img]:min-w-0 [&_img]:max-w-fit [&_img]:h-auto',
  height:
    '[&_li]:items-center [&_li]:mx-auto [&_li]:w-fit [&_li]:h-full [&_picture]:contents [&_img]:max-w-fit [&_img]:h-auto [&_img]:max-h-dvh',
  all: 'p-safe [&_li]:items-center [&_li]:mx-auto [&_picture]:contents [&_img]:min-w-0 [&_li]:w-fit [&_li]:h-full [&_img]:max-h-dvh',
}

type ItemProps<TPage extends ReaderPage> = {
  isLowDataMode: boolean
  offset: number
  readerLayout: ReaderLayout<TPage>
  renderPage: ReaderPageRenderer<TPage>
}

type Props<TPage extends ReaderPage> = {
  isLowDataMode: boolean
  onClick: () => void
  pages: readonly TPage[]
  readerLayout: ReaderLayout<TPage>
  renderPage: ReaderPageRenderer<TPage>
  showTouchAreaOverlay: boolean
}

export default function PagedReaderView<TPage extends ReaderPage>({
  isLowDataMode,
  onClick,
  pages,
  readerLayout,
  renderPage,
  showTouchAreaOverlay,
}: Props<TPage>) {
  const screenFit = useReaderStore((state) => state.screenFit)
  const maxPageIndex = Math.max(0, pages.length - 1)
  const { prevPage, nextPage } = usePageNavigation({ maxPageIndex, readerLayout })

  const pagedReaderViewOffsets = isLowDataMode
    ? [0, 1]
    : Array.from({ length: PAGED_READER_VIEW_WINDOW_SIZE }, (_, i) => i - 1)

  const {
    captureZoomAnchorAtClientPoint,
    contentRef,
    isDefaultZoom,
    measureZoomLayout,
    scrollRef,
    styles,
    zoomToAnchor,
  } = usePagedReaderViewZoom()

  const { handlePointerCancel, handlePointerDown, handlePointerMove, handlePointerUp } = useViewerPointerGestures({
    captureZoomAnchorAtClientPoint,
    nextPage,
    onCenterTap: onClick,
    prevPage,
    zoomToAnchor,
  })

  usePagedReaderViewScrollRestoration({ scrollRef })
  usePagedReaderViewWheelNavigation({ nextPage, prevPage, scrollRef })

  return (
    <>
      {isDefaultZoom && showTouchAreaOverlay && <TouchAreaOverlay />}
      <div
        className={`h-dvh overflow-auto overscroll-none touch-none ${NATIVE_GESTURE_BLOCK_CSS}`}
        onDragStart={(e) => e.preventDefault()}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={scrollRef}
      >
        <div className="relative min-h-full min-w-full" style={styles.zoomScrollArea}>
          <ul
            className={`absolute left-0 top-0 h-dvh [&_li]:flex [&_li]:aria-hidden:sr-only [&_img]:border [&_img]:border-background ${screenFitContentStyle[screenFit]}`}
            onLoadCapture={measureZoomLayout}
            ref={contentRef}
            style={styles.zoomContent}
          >
            {pages.length === 0 ? (
              <li className="flex items-center justify-center h-full animate-fade-in">
                <output className="flex items-center justify-center">
                  <Loader2 aria-hidden="true" className="size-8 animate-spin" />
                  <span className="sr-only">이미지 불러오는 중</span>
                </output>
              </li>
            ) : (
              pagedReaderViewOffsets.map((offset) => (
                <PagedReaderViewItem
                  isLowDataMode={isLowDataMode}
                  key={offset}
                  offset={offset}
                  readerLayout={readerLayout}
                  renderPage={renderPage}
                />
              ))
            )}
          </ul>
        </div>
      </div>
    </>
  )
}

function PagedReaderViewItem<TPage extends ReaderPage>({
  isLowDataMode,
  offset,
  readerLayout,
  renderPage,
}: ItemProps<TPage>) {
  const currentPageIndex = useReaderStore((state) => state.pageIndex)
  const brightness = useReaderSessionStore((state) => state.brightness)
  const isLTR = useReaderStore((state) => state.readingDirection === 'ltr')

  const fetchPriority = isLowDataMode
    ? offset === 0
      ? 'high'
      : 'low'
    : offset < IMAGE_FETCH_PRIORITY_THRESHOLD
      ? 'high'
      : 'low'

  const activeSpreadIndex = readerLayout.spreadIndexByPageIndex[currentPageIndex] ?? 0
  const spreadIndex = activeSpreadIndex + offset
  const spread = readerLayout.spreads[spreadIndex]

  if (!spread) {
    return null
  }

  const spreadPages = spread.pages.map((page, index) => ({
    page,
    pageIndex: spread.pageIndexes[index] ?? spread.startPageIndex,
  }))

  const orderedSpreadPages = isLTR ? spreadPages : [...spreadPages].reverse()

  return (
    <li aria-hidden={offset !== 0} style={{ filter: `brightness(${brightness}%)` }}>
      {orderedSpreadPages.map(({ page, pageIndex }) => (
        <Fragment key={page.id}>
          {renderPage({
            fetchPriority,
            isActive: offset === 0,
            isLowDataMode,
            page,
            pageIndex,
            spreadIndex,
          })}
        </Fragment>
      ))}
    </li>
  )
}

function TouchAreaOverlay() {
  const orientation = useReaderStore((state) => state.orientation)
  const isHorizontal = orientation === 'horizontal' || orientation === 'horizontal-reverse'
  const isReversed = orientation === 'horizontal-reverse' || orientation === 'vertical-reverse'

  return (
    <div
      aria-hidden="true"
      aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
      className="fixed inset-0 z-10 pointer-events-none flex select-none transition text-foreground text-xs font-medium aria-[orientation=vertical]:flex-col"
    >
      <div className="flex-1 flex items-center justify-center">
        <span className="px-4 py-2 rounded-full bg-background/80 border border-foreground/40">
          {isReversed ? '다음' : '이전'}
        </span>
      </div>
      {isHorizontal && <div className="flex-1" />}
      <div className="flex-1 flex items-center justify-center">
        <span className="px-4 py-2 rounded-full bg-background/80 border border-foreground/40">
          {isReversed ? '이전' : '다음'}
        </span>
      </div>
    </div>
  )
}
