import { type CSSProperties, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { clampZoomLevel, DEFAULT_ZOOM, useReaderSessionStore, useReaderStore } from '../store/reader'
import { shouldIgnoreViewerGestureTarget } from '../viewerGesturePolicy'
import { captureZoomAnchor, getNextWheelZoomLevel, type ZoomAnchor } from './viewerZoom'

type CaptureZoomAnchorParams = {
  clientX: number
  clientY: number
  currentZoom: number
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

export default function usePageViewerZoom() {
  const currentIndex = useReaderStore((state) => state.pageIndex)
  const isDoublePage = useReaderStore((state) => state.pageView === 'double')
  const isRTL = useReaderStore((state) => state.readingDirection === 'rtl')
  const screenFit = useReaderStore((state) => state.screenFit)
  const zoomLevel = useReaderSessionStore((state) => state.zoomLevel)
  const getZoomLevel = useReaderSessionStore((state) => state.getZoomLevel)
  const setZoomLevel = useReaderSessionStore((state) => state.setZoomLevel)
  const resetZoom = useReaderSessionStore((state) => state.resetZoom)

  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLUListElement>(null)
  const pendingZoomAnchorRef = useRef<ZoomAnchor | null>(null)
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

  const captureZoomAnchorAtClientPoint = useCallback(({ clientX, clientY, currentZoom }: CaptureZoomAnchorParams) => {
    const scroll = scrollRef.current
    const content = contentRef.current

    if (!scroll || !content) {
      return null
    }

    return captureZoomAnchor({
      clientX,
      clientY,
      contentRect: content.getBoundingClientRect(),
      currentZoom,
      scrollLeft: scroll.scrollLeft,
      scrollTop: scroll.scrollTop,
      viewportRect: scroll.getBoundingClientRect(),
    })
  }, [])

  const applyAnchoredScroll = useCallback((anchor: ZoomAnchor, nextZoom: number) => {
    const scroll = scrollRef.current

    if (scroll) {
      scroll.scrollLeft = Math.max(0, anchor.contentLeft + anchor.contentX * nextZoom - anchor.viewportX)
      scroll.scrollTop = Math.max(0, anchor.contentTop + anchor.contentY * nextZoom - anchor.viewportY)
    }
  }, [])

  const zoomToAnchor = useCallback(
    (anchor: ZoomAnchor, nextZoom: number) => {
      const clampedNextZoom = clampZoomLevel(nextZoom)

      if (clampedNextZoom === getZoomLevel()) {
        pendingZoomAnchorRef.current = null
        applyAnchoredScroll(anchor, clampedNextZoom)
        return false
      }

      pendingZoomAnchorRef.current = anchor
      setZoomLevel(clampedNextZoom)
      return true
    },
    [applyAnchoredScroll, getZoomLevel, setZoomLevel],
  )

  const handleZoomWheel = useCallback(
    (event: WheelEvent) => {
      const { ctrlKey, metaKey, clientX, clientY, target } = event

      if ((!ctrlKey && !metaKey) || shouldIgnoreViewerGestureTarget(target)) {
        return
      }

      event.preventDefault()

      const currentZoom = getZoomLevel()
      const nextZoom = getNextWheelZoomLevel(currentZoom, event)

      const anchor = captureZoomAnchorAtClientPoint({
        clientX,
        clientY,
        currentZoom,
      })

      if (anchor) {
        zoomToAnchor(anchor, nextZoom)
      }
    },
    [captureZoomAnchorAtClientPoint, getZoomLevel, zoomToAnchor],
  )

  const zoomScrollArea = {
    height: zoomLayout.contentHeight > 0 ? zoomLayout.contentHeight * zoomLevel : undefined,
    width: zoomLayout.contentWidth > 0 ? zoomLayout.contentWidth * zoomLevel : undefined,
  } satisfies CSSProperties

  const zoomContent = {
    minHeight: zoomLayout.viewportHeight > 0 ? zoomLayout.viewportHeight : undefined,
    transform: `scale(${zoomLevel})`,
    transformOrigin: 'top left',
    width: zoomLayout.viewportWidth > 0 ? zoomLayout.viewportWidth : '100%',
    willChange: zoomLevel > DEFAULT_ZOOM ? 'transform' : undefined,
  } satisfies CSSProperties

  // NOTE: 페이지 구성이나 보기 옵션이 바뀌면 화면에 그리기 전에 줌 기준 크기를 다시 재요
  useLayoutEffect(() => {
    measureZoomLayout()
  }, [currentIndex, isDoublePage, isRTL, measureZoomLayout, screenFit])

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
    const anchor = pendingZoomAnchorRef.current
    if (!anchor) {
      return
    }

    pendingZoomAnchorRef.current = null

    applyAnchoredScroll(anchor, zoomLevel)
  }, [applyAnchoredScroll, zoomLevel])

  // NOTE: ctrl/cmd + 0 키로 확대/축소를 초기화해요
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        pendingZoomAnchorRef.current = null
        resetZoom()

        const scroll = scrollRef.current

        if (scroll) {
          scroll.scrollLeft = 0
          scroll.scrollTop = 0
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [resetZoom])

  // NOTE: ctrl/cmd + wheel은 브라우저 페이지 확대 대신 뷰어 내부 확대에 사용해요
  useEffect(() => {
    const scroll = scrollRef.current

    if (!scroll) {
      return
    }

    scroll.addEventListener('wheel', handleZoomWheel, { passive: false })

    return () => {
      scroll.removeEventListener('wheel', handleZoomWheel)
    }
  }, [handleZoomWheel])

  return {
    captureZoomAnchorAtClientPoint,
    isDefaultZoom: zoomLevel === DEFAULT_ZOOM,
    measureZoomLayout,
    zoomToAnchor,
    contentRef,
    scrollRef,
    styles: {
      zoomContent,
      zoomScrollArea,
    },
  }
}
