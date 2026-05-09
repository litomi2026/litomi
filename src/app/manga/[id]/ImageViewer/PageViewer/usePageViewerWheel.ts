import { type RefObject, useCallback, useEffect, useRef } from 'react'

import { useOrientationStore } from '../store/orientation'
import { DEFAULT_ZOOM, useZoomStore } from '../store/zoom'
import {
  checkNavigatePageFromWheelBoundary,
  getWheelNavigationIntent,
  getWheelPageNavigation,
  WHEEL_EVENT_HANDLED,
  WHEEL_EVENT_IGNORED,
  type WheelHandlerResult,
} from './pageViewerWheel'

const WHEEL_NAVIGATION_THROTTLE = 500

type Params = {
  handleCursorZoomWheel: (event: WheelEvent) => WheelHandlerResult
  nextPage: () => void
  prevPage: () => void
  scrollRef: RefObject<HTMLDivElement | null>
}

export default function usePageViewerWheel({ handleCursorZoomWheel, nextPage, prevPage, scrollRef }: Params) {
  const getOrientation = useOrientationStore((state) => state.getOrientation)
  const getZoomLevel = useZoomStore((state) => state.getZoomLevel)
  const throttleRef = useRef(false)
  const throttleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearWheelNavigationThrottle = useCallback(() => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current)
      throttleTimeoutRef.current = null
    }

    throttleRef.current = false
  }, [])

  const startWheelNavigationThrottle = useCallback(() => {
    clearWheelNavigationThrottle()
    throttleRef.current = true
    throttleTimeoutRef.current = setTimeout(() => {
      throttleRef.current = false
      throttleTimeoutRef.current = null
    }, WHEEL_NAVIGATION_THROTTLE)
  }, [clearWheelNavigationThrottle])

  const handlePageNavigationWheel = useCallback(
    (event: WheelEvent, scrollElement: HTMLDivElement): WheelHandlerResult => {
      if (getZoomLevel() > DEFAULT_ZOOM) {
        return WHEEL_EVENT_IGNORED
      }

      if (throttleRef.current) {
        return WHEEL_EVENT_IGNORED
      }

      const intent = getWheelNavigationIntent(event)
      if (!intent) {
        return WHEEL_EVENT_IGNORED
      }

      const canNavigate = checkNavigatePageFromWheelBoundary(intent, {
        clientHeight: scrollElement.clientHeight,
        clientWidth: scrollElement.clientWidth,
        scrollHeight: scrollElement.scrollHeight,
        scrollLeft: scrollElement.scrollLeft,
        scrollTop: scrollElement.scrollTop,
        scrollWidth: scrollElement.scrollWidth,
      })

      if (!canNavigate) {
        return WHEEL_EVENT_IGNORED
      }

      event.preventDefault()
      startWheelNavigationThrottle()

      const navigation = getWheelPageNavigation(intent, getOrientation())

      if (navigation === 'next') {
        nextPage()
      } else {
        prevPage()
      }

      return WHEEL_EVENT_HANDLED
    },
    [getOrientation, getZoomLevel, nextPage, prevPage, startWheelNavigationThrottle],
  )

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) {
      return
    }

    const wheelTarget = scrollElement

    function handleWheel(event: WheelEvent) {
      if (handleCursorZoomWheel(event) === WHEEL_EVENT_HANDLED) {
        return
      }

      handlePageNavigationWheel(event, wheelTarget)
    }

    wheelTarget.addEventListener('wheel', handleWheel, { passive: false })

    return () => {
      wheelTarget.removeEventListener('wheel', handleWheel)
      clearWheelNavigationThrottle()
    }
  }, [clearWheelNavigationThrottle, handleCursorZoomWheel, handlePageNavigationWheel, scrollRef])
}
