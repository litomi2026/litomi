import { type MouseEvent, type PointerEvent, useEffect, useRef, useState } from 'react'

import { useBrightnessStore } from '../store/brightness'
import { useOrientationStore } from '../store/orientation'
import { DEFAULT_ZOOM, useZoomStore } from '../store/zoom'
import {
  canScrollAxis,
  type GestureAxis,
  getScrollableAxesInPath,
  isScreenEdge,
  type ScrollableAxes,
  shouldIgnoreViewerGestureTarget,
} from './viewerGesturePolicy'
import {
  type CursorZoomAnchor,
  DOUBLE_TAP_ZOOM_LEVEL,
  getDistance,
  getMidpoint,
  getNextOneFingerZoomLevel,
  getNextPinchZoomLevel,
} from './viewerZoom'

const HORIZONTAL_SWIPE_THRESHOLD = 50
const VERTICAL_BRIGHTNESS_THRESHOLD = 24
const DIRECTION_LOCK_RATIO = 1.4
const TAP_MOVE_THRESHOLD = 10
const PAN_ACTIVATION_THRESHOLD = 4
const DOUBLE_TAP_DELAY = 220
const DOUBLE_TAP_DISTANCE_THRESHOLD = 36
const ONE_FINGER_ZOOM_ACTIVATION_THRESHOLD = 8
const CLICK_SUPPRESSION_TIMEOUT = 1_000

type GesturePointer = {
  clientX: number
  clientY: number
  pointerType: string
  startX: number
  startY: number
}

type OneFingerZoomState = {
  active: boolean
  anchor: CursorZoomAnchor
  pointerId: number
  startY: number
  startZoom: number
}

type PanState = {
  active: boolean
  lastX: number
  lastY: number
  pointerId: number
}

type Params = {
  captureZoomAnchorAtClientPoint: (params: {
    clientX: number
    clientY: number
    currentZoom?: number
  }) => CursorZoomAnchor | null
  nextPage: () => void
  onCenterTap: () => void
  prevPage: () => void
  zoomToAnchor: (anchor: CursorZoomAnchor, nextZoom: number) => boolean
}

type PendingTouchTap = {
  clientX: number
  clientY: number
  target: HTMLElement
  timeoutId: ReturnType<typeof setTimeout>
}

type PinchState = {
  anchor: CursorZoomAnchor
  pointerIds: [number, number]
  startDistance: number
  startZoom: number
}

type PointerStart = {
  nativeScrollAxis: GestureAxis | null
  pointerType: string
  scrollableAxes: ScrollableAxes
  x: number
  y: number
}

type PreviousTouchTap = {
  time: number
  x: number
  y: number
}

export default function useViewerPointerGestures({
  captureZoomAnchorAtClientPoint,
  nextPage,
  onCenterTap,
  prevPage,
  zoomToAnchor,
}: Params) {
  const getOrientation = useOrientationStore((state) => state.getOrientation)
  const getBrightness = useBrightnessStore((state) => state.getBrightness)
  const setBrightness = useBrightnessStore((state) => state.setBrightness)
  const getZoomLevel = useZoomStore((state) => state.getZoomLevel)
  const [isNativeTouchActionBlocked, setIsNativeTouchActionBlocked] = useState(false)

  const activePointersRef = useRef(new Map<number, GesturePointer>())
  const clickSuppressionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ignoredPointerIdsRef = useRef(new Set<number>())
  const initialBrightnessRef = useRef(100)
  const oneFingerZoomRef = useRef<OneFingerZoomState | null>(null)
  const panRef = useRef<PanState | null>(null)
  const pendingTouchTapRef = useRef<PendingTouchTap | null>(null)
  const pinchRef = useRef<PinchState | null>(null)
  const pointerStartRef = useRef<PointerStart | null>(null)
  const previousTouchTapRef = useRef<PreviousTouchTap | null>(null)
  const suppressClickRef = useRef(false)
  const swipeDetectedRef = useRef(false)

  function clearClickSuppressionTimeout() {
    if (!clickSuppressionTimeoutRef.current) {
      return
    }

    clearTimeout(clickSuppressionTimeoutRef.current)
    clickSuppressionTimeoutRef.current = null
  }

  function suppressNextClick() {
    clearClickSuppressionTimeout()
    suppressClickRef.current = true

    clickSuppressionTimeoutRef.current = setTimeout(() => {
      suppressClickRef.current = false
      clickSuppressionTimeoutRef.current = null
    }, CLICK_SUPPRESSION_TIMEOUT)
  }

  function clearPendingTouchTap({ releaseTouchAction = true } = {}) {
    if (pendingTouchTapRef.current) {
      clearTimeout(pendingTouchTapRef.current.timeoutId)
      pendingTouchTapRef.current = null
    }

    previousTouchTapRef.current = null

    if (releaseTouchAction) {
      setIsNativeTouchActionBlocked(false)
    }
  }

  function capturePointer(target: HTMLDivElement, pointerId: number) {
    try {
      target.setPointerCapture(pointerId)
    } catch {
      // Some browsers cancel touch streams before React receives the matching cleanup event.
    }
  }

  function releasePointerCapture(target: HTMLDivElement, pointerId: number) {
    try {
      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId)
      }
    } catch {
      // The pointer may already be released by the browser.
    }
  }

  function claimPointerEvent(e: PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
  }

  function isTapMovement(diffX: number, diffY: number) {
    return Math.abs(diffX) <= TAP_MOVE_THRESHOLD && Math.abs(diffY) <= TAP_MOVE_THRESHOLD
  }

  function isDirectManipulationPointer(pointerType: string) {
    return pointerType === 'pen' || pointerType === 'touch'
  }

  function isDoubleTapStart(e: PointerEvent<HTMLDivElement>) {
    const previousTouchTap = previousTouchTapRef.current

    if (!previousTouchTap) {
      return false
    }

    const elapsed = performance.now() - previousTouchTap.time
    const distance = Math.hypot(e.clientX - previousTouchTap.x, e.clientY - previousTouchTap.y)

    return elapsed <= DOUBLE_TAP_DELAY && distance <= DOUBLE_TAP_DISTANCE_THRESHOLD
  }

  function runTapAction({ clientX, clientY, target }: Omit<PendingTouchTap, 'timeoutId'>) {
    if (!target.isConnected) {
      return
    }

    if (getZoomLevel() > DEFAULT_ZOOM) {
      onCenterTap()
      return
    }

    const rect = target.getBoundingClientRect()
    const orientation = getOrientation()

    if (orientation === 'horizontal') {
      const clickX = clientX - rect.left
      if (clickX < rect.width / 3) {
        prevPage()
      } else if (clickX > (rect.width * 2) / 3) {
        nextPage()
      } else {
        onCenterTap()
      }
    } else if (orientation === 'horizontal-reverse') {
      const clickX = clientX - rect.left
      if (clickX < rect.width / 3) {
        nextPage()
      } else if (clickX > (rect.width * 2) / 3) {
        prevPage()
      } else {
        onCenterTap()
      }
    } else if (orientation === 'vertical') {
      const clickY = clientY - rect.top
      if (clickY < rect.height / 3) {
        prevPage()
      } else if (clickY > (rect.height * 2) / 3) {
        nextPage()
      } else {
        onCenterTap()
      }
    } else if (orientation === 'vertical-reverse') {
      const clickY = clientY - rect.top
      if (clickY < rect.height / 3) {
        nextPage()
      } else if (clickY > (rect.height * 2) / 3) {
        prevPage()
      } else {
        onCenterTap()
      }
    }
  }

  function queueTouchTap(clientX: number, clientY: number, target: HTMLElement) {
    clearPendingTouchTap()
    suppressNextClick()
    setIsNativeTouchActionBlocked(true)

    previousTouchTapRef.current = {
      time: performance.now(),
      x: clientX,
      y: clientY,
    }

    const timeoutId = setTimeout(() => {
      const pendingTouchTap = pendingTouchTapRef.current
      pendingTouchTapRef.current = null
      previousTouchTapRef.current = null
      setIsNativeTouchActionBlocked(false)

      if (!pendingTouchTap) {
        return
      }

      runTapAction(pendingTouchTap)
    }, DOUBLE_TAP_DELAY)

    pendingTouchTapRef.current = {
      clientX,
      clientY,
      target,
      timeoutId,
    }
  }

  function startOneFingerZoom(e: PointerEvent<HTMLDivElement>) {
    const startZoom = getZoomLevel()

    const anchor = captureZoomAnchorAtClientPoint({
      clientX: e.clientX,
      clientY: e.clientY,
      currentZoom: startZoom,
    })

    if (!anchor) {
      return false
    }

    clearPendingTouchTap({ releaseTouchAction: false })
    setIsNativeTouchActionBlocked(true)

    oneFingerZoomRef.current = {
      active: false,
      anchor,
      pointerId: e.pointerId,
      startY: e.clientY,
      startZoom,
    }

    panRef.current = null
    pinchRef.current = null
    pointerStartRef.current = null
    suppressNextClick()
    capturePointer(e.currentTarget, e.pointerId)
    claimPointerEvent(e)

    return true
  }

  function cancelOneFingerZoom(e: PointerEvent<HTMLDivElement>) {
    const oneFingerZoom = oneFingerZoomRef.current

    if (!oneFingerZoom) {
      return
    }

    oneFingerZoomRef.current = null
    setIsNativeTouchActionBlocked(false)
    releasePointerCapture(e.currentTarget, oneFingerZoom.pointerId)
  }

  function startPinch(e: PointerEvent<HTMLDivElement>) {
    const pointers = [...activePointersRef.current.entries()]

    if (pointers.length !== 2) {
      return false
    }

    const [[firstId, first], [secondId, second]] = pointers
    if (!isDirectManipulationPointer(first.pointerType) || !isDirectManipulationPointer(second.pointerType)) {
      return false
    }

    const startDistance = getDistance(first, second)
    const startZoom = getZoomLevel()
    const center = getMidpoint(first, second)

    const anchor = captureZoomAnchorAtClientPoint({
      clientX: center.clientX,
      clientY: center.clientY,
      currentZoom: startZoom,
    })

    if (!anchor) {
      return false
    }

    clearPendingTouchTap({ releaseTouchAction: false })
    cancelOneFingerZoom(e)
    panRef.current = null
    pointerStartRef.current = null

    pinchRef.current = {
      anchor,
      pointerIds: [firstId, secondId],
      startDistance,
      startZoom,
    }
    setIsNativeTouchActionBlocked(true)

    capturePointer(e.currentTarget, firstId)
    capturePointer(e.currentTarget, secondId)
    suppressNextClick()
    claimPointerEvent(e)

    return true
  }

  function updatePointer(e: PointerEvent<HTMLDivElement>) {
    const pointer = activePointersRef.current.get(e.pointerId)

    if (!pointer) {
      return
    }

    activePointersRef.current.set(e.pointerId, {
      ...pointer,
      clientX: e.clientX,
      clientY: e.clientY,
    })
  }

  function handlePinchMove(e: PointerEvent<HTMLDivElement>) {
    const pinch = pinchRef.current

    if (!pinch || !pinch.pointerIds.includes(e.pointerId)) {
      return false
    }

    const first = activePointersRef.current.get(pinch.pointerIds[0])
    const second = activePointersRef.current.get(pinch.pointerIds[1])

    if (!first || !second) {
      return false
    }

    claimPointerEvent(e)

    zoomToAnchor(
      pinch.anchor,
      getNextPinchZoomLevel({
        currentDistance: getDistance(first, second),
        startDistance: pinch.startDistance,
        startZoom: pinch.startZoom,
      }),
    )

    return true
  }

  function handleZoomPanMove(e: PointerEvent<HTMLDivElement>) {
    const pan = panRef.current

    if (!pan || pan.pointerId !== e.pointerId) {
      return false
    }

    const diffX = e.clientX - pan.lastX
    const diffY = e.clientY - pan.lastY

    if (!pan.active && Math.hypot(e.clientX - pan.lastX, e.clientY - pan.lastY) < PAN_ACTIVATION_THRESHOLD) {
      return true
    }

    pan.active = true
    e.currentTarget.scrollLeft -= diffX
    e.currentTarget.scrollTop -= diffY
    pan.lastX = e.clientX
    pan.lastY = e.clientY
    claimPointerEvent(e)

    return true
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    if (isScreenEdge(e.clientX) || shouldIgnoreViewerGestureTarget(e.target)) {
      ignoredPointerIdsRef.current.add(e.pointerId)
      clearPendingTouchTap()
      return
    }

    activePointersRef.current.set(e.pointerId, {
      clientX: e.clientX,
      clientY: e.clientY,
      pointerType: e.pointerType,
      startX: e.clientX,
      startY: e.clientY,
    })

    if (e.pointerType === 'touch' && isDoubleTapStart(e)) {
      if (startOneFingerZoom(e)) {
        return
      }

      clearPendingTouchTap()
      suppressNextClick()
      claimPointerEvent(e)
      return
    }

    if (activePointersRef.current.size > 1) {
      startPinch(e)
      return
    }

    if (getZoomLevel() > DEFAULT_ZOOM) {
      panRef.current = {
        active: false,
        lastX: e.clientX,
        lastY: e.clientY,
        pointerId: e.pointerId,
      }

      pointerStartRef.current = {
        nativeScrollAxis: null,
        pointerType: e.pointerType,
        scrollableAxes: getScrollableAxesInPath(e.target, e.currentTarget),
        x: e.clientX,
        y: e.clientY,
      }

      capturePointer(e.currentTarget, e.pointerId)
      return
    }

    initialBrightnessRef.current = getBrightness()
    panRef.current = null

    pointerStartRef.current = {
      nativeScrollAxis: null,
      pointerType: e.pointerType,
      scrollableAxes: getScrollableAxesInPath(e.target, e.currentTarget),
      x: e.clientX,
      y: e.clientY,
    }

    swipeDetectedRef.current = false
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (ignoredPointerIdsRef.current.has(e.pointerId)) {
      return
    }

    updatePointer(e)

    const oneFingerZoom = oneFingerZoomRef.current

    if (oneFingerZoom?.pointerId === e.pointerId) {
      claimPointerEvent(e)

      if (activePointersRef.current.size > 1) {
        cancelOneFingerZoom(e)
        return
      }

      const dragDeltaY = e.clientY - oneFingerZoom.startY

      if (!oneFingerZoom.active && Math.abs(dragDeltaY) < ONE_FINGER_ZOOM_ACTIVATION_THRESHOLD) {
        return
      }

      oneFingerZoom.active = true
      zoomToAnchor(oneFingerZoom.anchor, getNextOneFingerZoomLevel(oneFingerZoom.startZoom, dragDeltaY))
      return
    }

    if (handlePinchMove(e)) {
      return
    }

    if (getZoomLevel() > DEFAULT_ZOOM && handleZoomPanMove(e)) {
      return
    }

    if (
      !pointerStartRef.current ||
      !isDirectManipulationPointer(pointerStartRef.current.pointerType) ||
      getZoomLevel() > DEFAULT_ZOOM
    ) {
      return
    }

    if (activePointersRef.current.size > 1) {
      return
    }

    const diffX = e.clientX - pointerStartRef.current.x
    const diffY = e.clientY - pointerStartRef.current.y

    const isHorizontalScrollIntent =
      Math.abs(diffX) > HORIZONTAL_SWIPE_THRESHOLD &&
      Math.abs(diffX) > Math.abs(diffY) * DIRECTION_LOCK_RATIO &&
      canScrollAxis(pointerStartRef.current.scrollableAxes, 'x')

    if (isHorizontalScrollIntent) {
      pointerStartRef.current.nativeScrollAxis = 'x'
      swipeDetectedRef.current = true
      clearPendingTouchTap()
      return
    }

    const isVerticalSwipe =
      Math.abs(diffY) > VERTICAL_BRIGHTNESS_THRESHOLD && Math.abs(diffY) > Math.abs(diffX) * DIRECTION_LOCK_RATIO

    if (!isVerticalSwipe) {
      return
    }

    if (canScrollAxis(pointerStartRef.current.scrollableAxes, 'y')) {
      pointerStartRef.current.nativeScrollAxis = 'y'
      swipeDetectedRef.current = true
      clearPendingTouchTap()
      return
    }

    swipeDetectedRef.current = true
    const rect = e.currentTarget.getBoundingClientRect()
    const deltaBrightness = (diffY / (rect.height / 2)) * 90
    setBrightness(initialBrightnessRef.current - deltaBrightness)
    claimPointerEvent(e)
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    if (ignoredPointerIdsRef.current.delete(e.pointerId)) {
      return
    }

    activePointersRef.current.delete(e.pointerId)

    const oneFingerZoom = oneFingerZoomRef.current

    if (oneFingerZoom?.pointerId === e.pointerId) {
      claimPointerEvent(e)
      releasePointerCapture(e.currentTarget, e.pointerId)
      oneFingerZoomRef.current = null
      pointerStartRef.current = null
      setIsNativeTouchActionBlocked(false)
      suppressNextClick()

      if (!oneFingerZoom.active) {
        const nextZoom = getZoomLevel() > DEFAULT_ZOOM ? DEFAULT_ZOOM : DOUBLE_TAP_ZOOM_LEVEL
        zoomToAnchor(oneFingerZoom.anchor, nextZoom)
      }

      return
    }

    const pinch = pinchRef.current

    if (pinch?.pointerIds.includes(e.pointerId)) {
      pinchRef.current = null
      releasePointerCapture(e.currentTarget, pinch.pointerIds[0])
      releasePointerCapture(e.currentTarget, pinch.pointerIds[1])
      pointerStartRef.current = null
      setIsNativeTouchActionBlocked(false)
      suppressNextClick()
      claimPointerEvent(e)

      const remainingPointer = [...activePointersRef.current.entries()][0]
      if (remainingPointer && getZoomLevel() > DEFAULT_ZOOM) {
        const [pointerId, pointer] = remainingPointer
        panRef.current = {
          active: false,
          lastX: pointer.clientX,
          lastY: pointer.clientY,
          pointerId,
        }

        pointerStartRef.current = {
          nativeScrollAxis: null,
          pointerType: pointer.pointerType,
          scrollableAxes: getScrollableAxesInPath(e.target, e.currentTarget),
          x: pointer.clientX,
          y: pointer.clientY,
        }

        capturePointer(e.currentTarget, pointerId)
      }

      return
    }

    const pan = panRef.current

    if (pan?.pointerId === e.pointerId) {
      panRef.current = null
      releasePointerCapture(e.currentTarget, e.pointerId)

      const diffX = e.clientX - (pointerStartRef.current?.x ?? e.clientX)
      const diffY = e.clientY - (pointerStartRef.current?.y ?? e.clientY)
      const isTouchTap = pointerStartRef.current?.pointerType === 'touch' && isTapMovement(diffX, diffY)
      pointerStartRef.current = null

      if (pan.active) {
        suppressNextClick()
        claimPointerEvent(e)
      } else if (isTouchTap) {
        queueTouchTap(e.clientX, e.clientY, e.currentTarget)
      }

      return
    }

    if (!pointerStartRef.current) {
      return
    }

    const diffX = e.clientX - pointerStartRef.current.x
    const diffY = e.clientY - pointerStartRef.current.y
    const isTouchTap = pointerStartRef.current.pointerType === 'touch' && isTapMovement(diffX, diffY)
    const isDirectManipulation = isDirectManipulationPointer(pointerStartRef.current.pointerType)

    if (pointerStartRef.current.nativeScrollAxis) {
      pointerStartRef.current = null
      return
    }

    if (getZoomLevel() > DEFAULT_ZOOM) {
      pointerStartRef.current = null
      if (isTouchTap) {
        queueTouchTap(e.clientX, e.clientY, e.currentTarget)
      }
      return
    }

    if (!isDirectManipulation && !isTapMovement(diffX, diffY)) {
      pointerStartRef.current = null
      swipeDetectedRef.current = true
      return
    }

    const isVerticalBrightnessSwipe =
      isDirectManipulation &&
      Math.abs(diffY) > VERTICAL_BRIGHTNESS_THRESHOLD &&
      Math.abs(diffY) > Math.abs(diffX) * DIRECTION_LOCK_RATIO

    if (isVerticalBrightnessSwipe) {
      pointerStartRef.current = null
      return
    }

    const isHorizontalPageSwipe =
      isDirectManipulation &&
      Math.abs(diffX) > HORIZONTAL_SWIPE_THRESHOLD &&
      Math.abs(diffX) > Math.abs(diffY) * DIRECTION_LOCK_RATIO

    if (isHorizontalPageSwipe) {
      if (canScrollAxis(pointerStartRef.current.scrollableAxes, 'x')) {
        pointerStartRef.current = null
        return
      }

      swipeDetectedRef.current = true
      const orientation = getOrientation()
      const isReversed = orientation === 'horizontal-reverse' || orientation === 'vertical-reverse'

      if (diffX > 0) {
        if (isReversed) {
          nextPage()
        } else {
          prevPage()
        }
      } else if (isReversed) {
        prevPage()
      } else {
        nextPage()
      }
    }

    pointerStartRef.current = null

    if (isTouchTap) {
      queueTouchTap(e.clientX, e.clientY, e.currentTarget)
    }
  }

  function handlePointerCancel(e: PointerEvent<HTMLDivElement>) {
    ignoredPointerIdsRef.current.delete(e.pointerId)
    activePointersRef.current.delete(e.pointerId)
    cancelOneFingerZoom(e)

    const pinch = pinchRef.current
    if (pinch?.pointerIds.includes(e.pointerId)) {
      pinchRef.current = null
      setIsNativeTouchActionBlocked(false)
    }

    if (panRef.current?.pointerId === e.pointerId) {
      panRef.current = null
    }

    if (pointerStartRef.current) {
      swipeDetectedRef.current = true
    }

    pointerStartRef.current = null
  }

  function handleClick(e: MouseEvent<HTMLDivElement>) {
    if (suppressClickRef.current) {
      suppressClickRef.current = false
      clearClickSuppressionTimeout()
      return
    }

    if (swipeDetectedRef.current) {
      swipeDetectedRef.current = false
      return
    }

    if (isScreenEdge(e.clientX) || shouldIgnoreViewerGestureTarget(e.target)) {
      return
    }

    runTapAction({
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.currentTarget,
    })
  }

  useEffect(() => {
    return () => {
      if (pendingTouchTapRef.current) {
        clearTimeout(pendingTouchTapRef.current.timeoutId)
        pendingTouchTapRef.current = null
      }

      if (clickSuppressionTimeoutRef.current) {
        clearTimeout(clickSuppressionTimeoutRef.current)
        clickSuppressionTimeoutRef.current = null
      }
    }
  }, [])

  return {
    handleClick,
    handlePointerCancel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isNativeTouchActionBlocked,
  }
}
