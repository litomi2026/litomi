import { type RefObject, useEffect, useRef } from 'react'

import { DEFAULT_ZOOM, type Orientation, useReaderSessionStore, useReaderStore } from '../store/reader'
import { getScrollableAxesInPath, shouldIgnoreViewerGestureTarget } from '../viewerGesturePolicy'
import { getNormalizedWheelDelta } from './viewerZoom'

const WHEEL_PAGE_NAVIGATION_THRESHOLD = 80
const WHEEL_PAGE_NAVIGATION_COOLDOWN_MS = 420
const WHEEL_PAGE_NAVIGATION_RESET_MS = 180

type Params = {
  nextPage: () => void
  prevPage: () => void
  scrollRef: RefObject<HTMLElement | null>
}

type WheelDirection = -1 | 1

export default function usePagedReaderViewWheelNavigation({ nextPage, prevPage, scrollRef }: Params) {
  const getOrientation = useReaderStore((state) => state.getOrientation)
  const getZoomLevel = useReaderSessionStore((state) => state.getZoomLevel)
  const accumulatedDeltaRef = useRef(0)
  const cooldownUntilRef = useRef(0)
  const directionRef = useRef<WheelDirection | null>(null)
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // NOTE: 확대 중이 아니고 내부 스크롤이 없을 때만 휠 입력을 모아 페이지를 넘겨요
  useEffect(() => {
    const element = scrollRef.current
    if (!element) {
      return
    }

    const wheelTarget = element

    function clearResetTimeout() {
      if (!resetTimeoutRef.current) {
        return
      }

      clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = null
    }

    function resetWheelIntent() {
      accumulatedDeltaRef.current = 0
      directionRef.current = null
      clearResetTimeout()
    }

    function scheduleWheelIntentReset() {
      clearResetTimeout()
      resetTimeoutRef.current = setTimeout(resetWheelIntent, WHEEL_PAGE_NAVIGATION_RESET_MS)
    }

    function handleWheel(event: WheelEvent) {
      const { defaultPrevented, ctrlKey, metaKey, altKey, shiftKey, target } = event

      if (
        defaultPrevented ||
        ctrlKey ||
        metaKey ||
        altKey ||
        shiftKey ||
        getZoomLevel() > DEFAULT_ZOOM ||
        shouldIgnoreViewerGestureTarget(target)
      ) {
        return
      }

      const scrollableAxes = getScrollableAxesInPath(target, wheelTarget)

      if (scrollableAxes.x || scrollableAxes.y) {
        resetWheelIntent()
        return
      }

      const orientation = getOrientation()
      const navigationDelta = getPageNavigationWheelDelta(event, orientation)

      if (navigationDelta === 0) {
        return
      }

      event.preventDefault()

      const now = performance.now()
      const direction = navigationDelta > 0 ? 1 : -1
      const isReversed = orientation === 'horizontal-reverse' || orientation === 'vertical-reverse'
      const shouldGoNext = direction > 0 ? !isReversed : isReversed

      if (now < cooldownUntilRef.current) {
        return
      }

      if (directionRef.current !== direction) {
        accumulatedDeltaRef.current = 0
        directionRef.current = direction
      }

      accumulatedDeltaRef.current += Math.abs(navigationDelta)
      scheduleWheelIntentReset()

      if (accumulatedDeltaRef.current < WHEEL_PAGE_NAVIGATION_THRESHOLD) {
        return
      }

      resetWheelIntent()
      cooldownUntilRef.current = now + WHEEL_PAGE_NAVIGATION_COOLDOWN_MS

      if (shouldGoNext) {
        nextPage()
      } else {
        prevPage()
      }
    }

    wheelTarget.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      wheelTarget.removeEventListener('wheel', handleWheel)
      clearResetTimeout()
    }
  }, [getOrientation, getZoomLevel, nextPage, prevPage, scrollRef])
}

function getPageNavigationWheelDelta(event: WheelEvent, orientation: Orientation) {
  const normalizedDeltaX = getNormalizedWheelDelta({
    delta: event.deltaX,
    deltaMode: event.deltaMode,
  })

  const normalizedDeltaY = getNormalizedWheelDelta({
    delta: event.deltaY,
    deltaMode: event.deltaMode,
  })

  const isHorizontal = orientation === 'horizontal' || orientation === 'horizontal-reverse'

  if (isHorizontal) {
    return Math.abs(normalizedDeltaX) > Math.abs(normalizedDeltaY) ? normalizedDeltaX : normalizedDeltaY
  }

  return normalizedDeltaY || normalizedDeltaX
}
