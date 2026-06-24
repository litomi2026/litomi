import { type CSSProperties, Fragment, useEffect, useRef, useState, type WheelEvent } from 'react'
import { useInView } from 'react-intersection-observer'
import { type CellComponentProps, Grid, useGridRef } from 'react-window'
import type { ReaderLayout, ReaderPage, ReaderPageRenderer } from '#reader/model/readerLayout'
import {
  getScrollableAxesInPath,
  NATIVE_GESTURE_BLOCK_CSS,
  shouldIgnoreViewerGestureTarget,
} from '#reader/model/viewerGesturePolicy'
import { type ImageFit, type ReadingDirection, useReaderSessionStore, useReaderStore } from '#reader/state/readerStore'
import { getNormalizedWheelDelta } from '#reader/views/paged/gestures/viewerZoom'

import { type Props, ScrollReaderViewLoading } from './shared'

const DEFAULT_PAGE_ASPECT_RATIO = 0.7
const DEFAULT_AVAILABLE_HEIGHT = 1000
const DEFAULT_AVAILABLE_WIDTH = 1000
const HORIZONTAL_CELL_BASE_CLASS_NAME = 'flex min-h-0 min-w-0 [&_picture]:contents'

const horizontalImageFitStyle: Record<ImageFit, string> = {
  // 화면 맞춤: 이미지를 화면 안에 맞추고(좁으면 너비, 넓으면 높이) 끊김 없이 연속 스크롤해요.
  contain:
    'items-center justify-center overflow-hidden [&_img]:max-w-[calc(100%/var(--spread-page-count))] [&_img]:max-h-dvh [&_img]:w-auto [&_img]:h-auto',
  // 세로 맞춤: 이미지를 화면 높이에 맞추고 자연 너비로 나열해 끊김 없이 연속 스크롤해요.
  height:
    'items-center justify-center overflow-hidden [&_img]:h-dvh [&_img]:w-auto [&_img]:max-w-full [&_img]:max-h-dvh',
  // 가로 맞춤: 페이지를 화면 너비에 맞추고, 세로로 넘치면 내부 세로 스크롤해요.
  width:
    'items-start justify-center overflow-y-auto overscroll-y-none [&_img]:w-[calc(100%/var(--spread-page-count))] [&_img]:h-auto',
}

type HorizontalCellProps<TPage extends ReaderPage> = {
  availableHeight: number
  availableWidth: number
  aspectRatio: number
  imageFit: ImageFit
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
  const containerRef = useRef<HTMLDivElement>(null)
  const hasPositionedInitialColumnRef = useRef(false)
  const hasMeasuredAspectRatioRef = useRef(false)
  const brightness = useReaderSessionStore((state) => state.brightness)
  const avoidCutout = useReaderStore((state) => state.avoidCutout)
  const imageFit = useReaderStore((state) => state.imageFit)
  const readingDirection = useReaderStore((state) => state.readingDirection)
  const pageIndex = useReaderStore((state) => state.pageIndex)
  const scrollTargetPageIndex = useReaderStore((state) => state.scrollTargetPageIndex)
  const clearScrollTargetPageIndex = useReaderStore((state) => state.clearScrollTargetPageIndex)
  const [aspectRatio, setAspectRatio] = useState(DEFAULT_PAGE_ASPECT_RATIO)
  const [availableHeight, setAvailableHeight] = useState(() => getAvailableHeight())
  const [availableWidth, setAvailableWidth] = useState(() => getAvailableWidth())

  const overscanCount = isLowDataMode ? 1 : 3
  const maxPage = readerLayout.spreadIndexByPageIndex.length
  const isContinuous = imageFit !== 'width'
  const columnWidth = isContinuous ? computeContinuousColumnWidth<TPage> : '100%'

  const dynamicStyle = {
    filter: `brightness(${brightness}%)`,
  } as CSSProperties

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

  // NOTE: 컨테이너 높이를 추적하고, 첫 로드 이미지의 종횡비를 한 번 측정해 연속 모드 열 폭에 반영해요.
  useEffect(() => {
    const element = containerRef.current

    if (!element) {
      return
    }

    // NOTE: 작품이 바뀌면(페이지 수 변화) 새 콘텐츠 기준으로 종횡비를 다시 측정해요.
    hasMeasuredAspectRatioRef.current = false

    const resizeObserver = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect

      if (!rect) {
        return
      }

      if (rect.height > 0) {
        setAvailableHeight(rect.height)
      }

      if (rect.width > 0) {
        setAvailableWidth(rect.width)
      }
    })
    resizeObserver.observe(element)

    function measureAspectRatio(target: EventTarget | null) {
      if (hasMeasuredAspectRatioRef.current || !(target instanceof HTMLImageElement)) {
        return
      }

      if (!target.naturalWidth || !target.naturalHeight) {
        return
      }

      hasMeasuredAspectRatioRef.current = true
      setAspectRatio(target.naturalWidth / target.naturalHeight)
      element?.removeEventListener('load', handleImageLoad, true)
    }

    function handleImageLoad(event: Event) {
      measureAspectRatio(event.target)
    }

    // NOTE: load 이벤트는 버블링되지 않으므로 캡처 단계로 자식 이미지를 가로채요.
    element.addEventListener('load', handleImageLoad, true)
    measureAspectRatio(element.querySelector('img'))

    return () => {
      resizeObserver.disconnect()
      element.removeEventListener('load', handleImageLoad, true)
    }
  }, [maxPage])

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

  if (maxPage === 0) {
    return <ScrollReaderViewLoading onClick={onClick} />
  }

  return (
    <div
      className={`overflow-hidden h-dvh contain-strict ${NATIVE_GESTURE_BLOCK_CSS}`}
      onClick={onClick}
      ref={containerRef}
      style={dynamicStyle}
    >
      <Grid
        cellComponent={HorizontalScrollReaderViewCell}
        cellProps={{
          availableHeight,
          availableWidth,
          aspectRatio,
          imageFit,
          isLowDataMode,
          readingDirection,
          readerLayout,
          renderPage,
        }}
        className="h-full w-full overscroll-none scrollbar-hidden"
        columnCount={readerLayout.spreads.length}
        columnWidth={columnWidth}
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

function computeContinuousColumnWidth<TPage extends ReaderPage>(index: number, props: HorizontalCellProps<TPage>) {
  const spreadIndex = getLogicalSpreadIndex(index, props.readerLayout.spreads.length, props.readingDirection)
  const pageCount = props.readerLayout.spreads[spreadIndex]?.pages.length ?? 1
  const naturalWidth = props.availableHeight * props.aspectRatio * pageCount
  const width = props.imageFit === 'contain' ? Math.min(props.availableWidth, naturalWidth) : naturalWidth

  return Math.max(1, Math.round(width))
}

function getAvailableHeight() {
  return typeof window === 'undefined' ? DEFAULT_AVAILABLE_HEIGHT : window.innerHeight
}

function getAvailableWidth() {
  return typeof window === 'undefined' ? DEFAULT_AVAILABLE_WIDTH : window.innerWidth
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
  imageFit,
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
      className={`${HORIZONTAL_CELL_BASE_CLASS_NAME} ${horizontalImageFitStyle[imageFit]}`}
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
