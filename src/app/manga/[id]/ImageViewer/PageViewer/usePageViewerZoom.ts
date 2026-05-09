import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { useImageIndexStore } from '../store/imageIndex'
import { usePageViewStore } from '../store/pageView'
import { useReadingDirectionStore } from '../store/readingDirection'
import { useScreenFitStore } from '../store/screenFit'
import { clampZoomLevel, DEFAULT_ZOOM, useZoomStore } from '../store/zoom'
import { WHEEL_EVENT_HANDLED, WHEEL_EVENT_IGNORED, type WheelHandlerResult } from './pageViewerWheel'
import {
  captureCursorZoomAnchor,
  type CursorZoomAnchor,
  getCursorAnchoredScrollPosition,
  getNextWheelZoomLevel,
} from './pageViewerZoom'

type CaptureClientZoomAnchorParams = {
  clientX: number
  clientY: number
  currentZoom?: number
  scrollElement: HTMLDivElement
}

type Params = {
  imageCount: number
}

type ZoomLayout = {
  contentHeight: number
  contentWidth: number
  viewportHeight: number
  viewportWidth: number
}

const INITIAL_ZOOM_LAYOUT: ZoomLayout = {
  contentHeight: 0,
  contentWidth: 0,
  viewportHeight: 0,
  viewportWidth: 0,
}

export default function usePageViewerZoom({ imageCount }: Params) {
  const currentIndex = useImageIndexStore((state) => state.imageIndex)
  const isDoublePage = usePageViewStore((state) => state.pageView === 'double')
  const isRTL = useReadingDirectionStore((state) => state.readingDirection === 'rtl')
  const screenFit = useScreenFitStore((state) => state.screenFit)
  const zoomLevel = useZoomStore((state) => state.zoomLevel)
  const getZoomLevel = useZoomStore((state) => state.getZoomLevel)
  const setZoomLevel = useZoomStore((state) => state.setZoomLevel)
  const resetZoom = useZoomStore((state) => state.resetZoom)
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLUListElement>(null)
  const pendingCursorZoomAnchorRef = useRef<CursorZoomAnchor | null>(null)
  const [zoomLayout, setZoomLayout] = useState(INITIAL_ZOOM_LAYOUT)

  const measureZoomLayout = useCallback(() => {
    const scroll = scrollRef.current
    const content = contentRef.current

    if (!scroll || !content) {
      return
    }

    const nextLayout = {
      contentHeight: Math.max(content.scrollHeight, scroll.clientHeight),
      contentWidth: Math.max(content.scrollWidth, scroll.clientWidth),
      viewportHeight: scroll.clientHeight,
      viewportWidth: scroll.clientWidth,
    }

    setZoomLayout((prev) => {
      if (
        prev.contentHeight === nextLayout.contentHeight &&
        prev.contentWidth === nextLayout.contentWidth &&
        prev.viewportHeight === nextLayout.viewportHeight &&
        prev.viewportWidth === nextLayout.viewportWidth
      ) {
        return prev
      }

      return nextLayout
    })
  }, [])

  const captureClientZoomAnchor = useCallback(
    ({ clientX, clientY, currentZoom = getZoomLevel(), scrollElement }: CaptureClientZoomAnchorParams) => {
      const content = contentRef.current

      if (!content) {
        return null
      }

      return captureCursorZoomAnchor({
        clientX,
        clientY,
        contentRect: content.getBoundingClientRect(),
        currentZoom,
        scrollLeft: scrollElement.scrollLeft,
        scrollTop: scrollElement.scrollTop,
        viewportRect: scrollElement.getBoundingClientRect(),
      })
    },
    [getZoomLevel],
  )

  const zoomToAnchor = useCallback(
    (anchor: CursorZoomAnchor, nextZoom: number) => {
      const clampedNextZoom = clampZoomLevel(nextZoom)

      if (clampedNextZoom === getZoomLevel()) {
        pendingCursorZoomAnchorRef.current = null
        return false
      }

      pendingCursorZoomAnchorRef.current = anchor
      setZoomLevel(clampedNextZoom)
      return true
    },
    [getZoomLevel, setZoomLevel],
  )

  const handleCursorZoomWheel = useCallback(
    (event: WheelEvent, scrollElement: HTMLDivElement): WheelHandlerResult => {
      const { ctrlKey, metaKey, clientX, clientY } = event

      if (!ctrlKey && !metaKey) {
        return WHEEL_EVENT_IGNORED
      }

      event.preventDefault()

      const currentZoom = getZoomLevel()
      const nextZoom = getNextWheelZoomLevel(currentZoom, event)

      const anchor = captureClientZoomAnchor({
        clientX,
        clientY,
        currentZoom,
        scrollElement,
      })

      if (anchor) {
        zoomToAnchor(anchor, nextZoom)
      }

      return WHEEL_EVENT_HANDLED
    },
    [captureClientZoomAnchor, getZoomLevel, zoomToAnchor],
  )

  const zoomScrollAreaStyle = {
    height: zoomLayout.contentHeight > 0 ? zoomLayout.contentHeight * zoomLevel : undefined,
    width: zoomLayout.contentWidth > 0 ? zoomLayout.contentWidth * zoomLevel : undefined,
  } satisfies CSSProperties

  const zoomContentStyle = {
    minHeight: zoomLayout.viewportHeight > 0 ? zoomLayout.viewportHeight : undefined,
    transform: `scale(${zoomLevel})`,
    transformOrigin: 'top left',
    width: zoomLayout.viewportWidth > 0 ? zoomLayout.viewportWidth : '100%',
    willChange: zoomLevel > DEFAULT_ZOOM ? 'transform' : undefined,
  } satisfies CSSProperties

  // NOTE: 페이지 구성이나 보기 옵션이 바뀌면 화면에 그리기 전에 줌 기준 크기를 다시 재요
  useLayoutEffect(() => {
    measureZoomLayout()
  }, [currentIndex, imageCount, isDoublePage, isRTL, measureZoomLayout, screenFit])

  // NOTE: 뷰포트나 콘텐츠 크기 변경을 즉시 반영해 확대된 스크롤 영역이 늦게 맞춰지지 않게 해요
  useLayoutEffect(() => {
    const scroll = scrollRef.current
    const content = contentRef.current

    if (!scroll || !content) {
      return
    }

    const resizeObserver = new ResizeObserver(measureZoomLayout)
    resizeObserver.observe(scroll)
    resizeObserver.observe(content)
    measureZoomLayout()

    return () => resizeObserver.disconnect()
  }, [measureZoomLayout])

  // NOTE: 커서 위치를 기준으로 줌한 뒤 같은 지점이 유지되도록 스크롤 위치를 보정해요
  useLayoutEffect(() => {
    const anchor = pendingCursorZoomAnchorRef.current
    if (!anchor) {
      return
    }

    pendingCursorZoomAnchorRef.current = null

    const scroll = scrollRef.current
    if (!scroll) {
      return
    }

    const { left, top } = getCursorAnchoredScrollPosition({ anchor, nextZoom: zoomLevel })
    scroll.scrollLeft = left
    scroll.scrollTop = top
  }, [zoomLevel])

  // NOTE: ctrl/cmd + 0 키로 확대/축소를 초기화해요
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        pendingCursorZoomAnchorRef.current = null
        resetZoom()

        const scroll = scrollRef.current
        if (scroll) {
          scroll.scrollLeft = 0
          scroll.scrollTop = 0
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [resetZoom])

  return {
    captureClientZoomAnchor,
    handleCursorZoomWheel,
    measureZoomLayout,
    zoomToAnchor,
    contentRef,
    scrollRef,
    zoomLevel,
    zoomContentStyle,
    zoomScrollAreaStyle,
  }
}
