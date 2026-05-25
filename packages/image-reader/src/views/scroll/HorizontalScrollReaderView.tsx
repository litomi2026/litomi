import type { ReaderLayout, ReaderPage, ReaderPageRenderer } from '#reader/model/readerLayout'

import {
  getScrollableAxesInPath,
  NATIVE_GESTURE_BLOCK_CSS,
  shouldIgnoreViewerGestureTarget,
} from '#reader/model/viewerGesturePolicy'
import { type ReadingDirection, useReaderSessionStore, useReaderStore } from '#reader/state/readerStore'
import { getNormalizedWheelDelta } from '#reader/views/paged/gestures/viewerZoom'
import { type CSSProperties, Fragment, useEffect, useRef, type WheelEvent } from 'react'
import { useInView } from 'react-intersection-observer'
import { type CellComponentProps, Grid, useGridRef } from 'react-window'

import { Props, ScrollReaderViewLoading } from './shared'

const HORIZONTAL_SCROLL_PAGE_CLASS_NAME =
  'items-center justify-center overflow-hidden p-safe [&_picture]:contents [&_img]:max-w-[calc(100%/var(--spread-page-count))] [&_img]:max-h-[calc(100dvh-var(--safe-area-top)-var(--safe-area-bottom))] [&_img]:h-auto'

type HorizontalCellProps<TPage extends ReaderPage> = {
  isLowDataMode: boolean
  readingDirection: ReadingDirection
  readerLayout: ReaderLayout<TPage>
  renderPage: ReaderPageRenderer<TPage>
}

export function HorizontalScrollReaderView<TPage extends ReaderPage>({
  isLowDataMode,
  onClick,
  readerLayout,
  renderPage,
}: Props<TPage>) {
  const gridRef = useGridRef(null)
  const hasPositionedInitialColumnRef = useRef(false)
  const brightness = useReaderSessionStore((state) => state.brightness)
  const readingDirection = useReaderStore((state) => state.readingDirection)
  const pageIndex = useReaderStore((state) => state.pageIndex)
  const scrollTargetPageIndex = useReaderStore((state) => state.scrollTargetPageIndex)
  const clearScrollTargetPageIndex = useReaderStore((state) => state.clearScrollTargetPageIndex)

  const overscanCount = isLowDataMode ? 1 : 3
  const maxPage = readerLayout.spreadIndexByPageIndex.length

  const dynamicStyle = {
    filter: `brightness(${brightness}%)`,
  } as CSSProperties

  // NOTE: 외부 컨트롤에서 페이지 이동을 요청하면 현재 spread layout 기준으로 해당 column을 보여줘요.
  useEffect(() => {
    if (scrollTargetPageIndex === null) {
      if (hasPositionedInitialColumnRef.current) {
        return
      }

      const grid = gridRef.current
      const element = grid?.element

      if (!grid || !element || element.clientWidth === 0) {
        return
      }

      grid.scrollToColumn({
        align: 'center',
        behavior: 'instant',
        index: getVisualSpreadIndexByPageIndex(readerLayout, pageIndex, readingDirection),
      })
      hasPositionedInitialColumnRef.current = true
      return
    }

    const grid = gridRef.current
    const element = grid?.element

    if (!grid || !element || element.clientWidth === 0) {
      return
    }

    grid.scrollToColumn({
      align: 'center',
      behavior: 'instant',
      index: getVisualSpreadIndexByPageIndex(readerLayout, scrollTargetPageIndex, readingDirection),
    })
    hasPositionedInitialColumnRef.current = true
    clearScrollTargetPageIndex()
  }, [clearScrollTargetPageIndex, gridRef, pageIndex, readerLayout, readingDirection, scrollTargetPageIndex])

  function handleGridResize() {
    if (hasPositionedInitialColumnRef.current) {
      return
    }

    const grid = gridRef.current
    const element = grid?.element

    if (!grid || !element || element.clientWidth === 0) {
      return
    }

    const targetPageIndex = scrollTargetPageIndex ?? pageIndex

    grid.scrollToColumn({
      align: 'center',
      behavior: 'instant',
      index: getVisualSpreadIndexByPageIndex(readerLayout, targetPageIndex, readingDirection),
    })
    hasPositionedInitialColumnRef.current = true

    if (scrollTargetPageIndex !== null) {
      clearScrollTargetPageIndex()
    }
  }

  function handleWheel(e: WheelEvent<HTMLDivElement>) {
    const { altKey, ctrlKey, defaultPrevented, deltaMode, metaKey, shiftKey, target } = e

    if (defaultPrevented || altKey || ctrlKey || metaKey || shouldIgnoreViewerGestureTarget(target)) {
      return
    }

    const normalizedDeltaX = getNormalizedWheelDelta({
      delta: e.deltaX,
      deltaMode,
    })

    const normalizedDeltaY = getNormalizedWheelDelta({
      delta: e.deltaY,
      deltaMode,
    })

    const isShiftWheelIntent = shiftKey && Math.abs(normalizedDeltaY) >= Math.abs(normalizedDeltaX)
    const isHorizontalIntent = isShiftWheelIntent || Math.abs(normalizedDeltaX) > Math.abs(normalizedDeltaY)
    const scrollDelta = isShiftWheelIntent ? normalizedDeltaY : isHorizontalIntent ? normalizedDeltaX : normalizedDeltaY

    if (scrollDelta === 0) {
      return
    }

    const scrollableAxes = getScrollableAxesInPath(target, e.currentTarget, { includeBoundary: false })

    if ((isHorizontalIntent && scrollableAxes.x) || (!isHorizontalIntent && scrollableAxes.y)) {
      return
    }

    e.preventDefault()
    const shouldInvertWheelDelta = (!isHorizontalIntent || isShiftWheelIntent) && readingDirection === 'rtl'
    e.currentTarget.scrollLeft += shouldInvertWheelDelta ? -scrollDelta : scrollDelta
  }

  if (maxPage === 0) {
    return <ScrollReaderViewLoading onClick={onClick} />
  }

  return (
    <div
      className={`overflow-hidden h-dvh contain-strict ${NATIVE_GESTURE_BLOCK_CSS}`}
      onClick={onClick}
      style={dynamicStyle}
    >
      <Grid
        cellComponent={HorizontalScrollReaderViewCell}
        cellProps={{ isLowDataMode, readingDirection, readerLayout, renderPage }}
        className="h-full w-full overscroll-none scrollbar-hidden"
        columnCount={readerLayout.spreads.length}
        columnWidth="100%"
        gridRef={gridRef}
        onResize={handleGridResize}
        onWheel={handleWheel}
        overscanCount={overscanCount}
        rowCount={1}
        rowHeight="100%"
      />
    </div>
  )
}

function getLogicalSpreadIndex(visualSpreadIndex: number, spreadCount: number, readingDirection: ReadingDirection) {
  return readingDirection === 'rtl' ? spreadCount - 1 - visualSpreadIndex : visualSpreadIndex
}

function getVisualSpreadIndex(spreadIndex: number, spreadCount: number, readingDirection: ReadingDirection) {
  return readingDirection === 'rtl' ? spreadCount - 1 - spreadIndex : spreadIndex
}

function getVisualSpreadIndexByPageIndex<TPage extends ReaderPage>(
  readerLayout: ReaderLayout<TPage>,
  pageIndex: number,
  readingDirection: ReadingDirection,
) {
  return getVisualSpreadIndex(
    readerLayout.spreadIndexByPageIndex[pageIndex] ?? pageIndex,
    readerLayout.spreads.length,
    readingDirection,
  )
}

function HorizontalScrollReaderViewCell<TPage extends ReaderPage>({
  ariaAttributes,
  columnIndex,
  isLowDataMode,
  readingDirection,
  readerLayout,
  renderPage,
  style,
}: CellComponentProps<HorizontalCellProps<TPage>>) {
  const currentPageIndex = useReaderStore((state) => state.pageIndex)
  const navigateToPageIndex = useReaderStore((state) => state.navigateToPageIndex)

  const spreadIndex = getLogicalSpreadIndex(columnIndex, readerLayout.spreads.length, readingDirection)
  const spread = readerLayout.spreads[spreadIndex]
  const firstPageIndex = spread?.startPageIndex ?? 0
  const isCurrentColumn = spreadIndex === (readerLayout.spreadIndexByPageIndex[currentPageIndex] ?? currentPageIndex)
  const fetchPriority = !isLowDataMode || isCurrentColumn ? 'high' : 'low'
  const maxPage = readerLayout.spreadIndexByPageIndex.length

  const { ref: inViewRef, inView } = useInView({
    threshold: 0,
    rootMargin: '0% -50% 0% -50%',
  })

  // NOTE: 가로 스크롤에서는 화면 중앙 column을 현재 페이지로 기록해요.
  useEffect(() => {
    if (inView && spread) {
      navigateToPageIndex(firstPageIndex, {
        maxIndex: Math.max(0, maxPage - 1),
        navigationType: 'relative',
        scroll: false,
      })
    }
  }, [firstPageIndex, inView, navigateToPageIndex, maxPage, spread])

  if (!spread) {
    return null
  }

  const spreadPages = spread.pages.map((page, pageOffset) => ({
    page,
    pageIndex: spread.pageIndexes[pageOffset] ?? spread.startPageIndex,
  }))

  const orderedSpreadPages = readingDirection === 'ltr' ? spreadPages : [...spreadPages].reverse()

  return (
    <div
      {...ariaAttributes}
      className={`flex min-h-0 min-w-0 ${HORIZONTAL_SCROLL_PAGE_CLASS_NAME}`}
      ref={inViewRef}
      style={{ ...style, '--spread-page-count': orderedSpreadPages.length } as CSSProperties}
    >
      {orderedSpreadPages.map(({ page, pageIndex }) => (
        <Fragment key={page.id}>
          {renderPage({
            fetchPriority,
            isActive: isCurrentColumn,
            isLowDataMode,
            page,
            pageIndex,
            spreadIndex,
          })}
        </Fragment>
      ))}
    </div>
  )
}
