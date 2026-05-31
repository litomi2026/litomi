import {
  canScrollAxis,
  getScrollableAxesInPath,
  isScreenEdge,
  type ScrollableAxes,
  shouldIgnoreViewerGestureTarget,
} from '#reader/model/viewerGesturePolicy'
import { DEFAULT_ZOOM, useReaderSessionStore, useReaderStore } from '#reader/state/readerStore'
import {
  DOUBLE_TAP_ZOOM_LEVEL,
  getDistance,
  getMidpoint,
  getNextOneFingerZoomLevel,
  getNextPinchZoomLevel,
  moveZoomAnchorToClientPoint,
  type ZoomAnchor,
} from '#reader/views/paged/gestures/viewerZoom'
import { type PointerEvent, useEffect, useRef } from 'react'

const HORIZONTAL_SWIPE_THRESHOLD = 50
const VERTICAL_BRIGHTNESS_THRESHOLD = 24
const DIRECTION_LOCK_RATIO = 1.4
const TAP_MOVE_THRESHOLD = 10
const PAN_ACTIVATION_THRESHOLD = 4
const SCROLL_PAN_INTENT_THRESHOLD = 6
const DOUBLE_TAP_DELAY = 200
const DOUBLE_TAP_DISTANCE_THRESHOLD = 36
const ONE_FINGER_ZOOM_ACTIVATION_THRESHOLD = 8

type GesturePointer = {
  clientX: number
  clientY: number
  pointerType: string
}

type IdleGestureState = {
  mode: 'idle'
}

type ObservingGestureState = {
  initialBrightness: number
  mode: 'observing'
  pointerId: number
  pointerType: string
  scrollableAxes: ScrollableAxes
  startX: number
  startY: number
}

type OneFingerZoomGestureState = {
  active: boolean
  anchor: ZoomAnchor
  mode: 'one-finger-zoom'
  pointerId: number
  startY: number
  startZoom: number
}

type PanGestureState = {
  active: boolean
  axes: ScrollableAxes
  lastX: number
  lastY: number
  mode: 'pan'
  pointerId: number
  pointerType: string
  startX: number
  startY: number
}

type Params = {
  captureZoomAnchorAtClientPoint: (params: {
    clientX: number
    clientY: number
    currentZoom: number
  }) => ZoomAnchor | null
  nextPage: () => void
  onCenterTap: () => void
  prevPage: () => void
  zoomToAnchor: (anchor: ZoomAnchor, nextZoom: number) => boolean
}

type PendingTouchTap = {
  clientX: number
  clientY: number
  target: HTMLElement
  timeoutId: ReturnType<typeof setTimeout>
}

type PinchGestureState = {
  anchor: ZoomAnchor
  mode: 'pinch'
  pointerIds: [number, number]
  startDistance: number
  startZoom: number
}

type PreviousTouchTap = {
  time: number
  x: number
  y: number
}

type ViewerGestureState =
  | IdleGestureState
  | ObservingGestureState
  | OneFingerZoomGestureState
  | PanGestureState
  | PinchGestureState

const IDLE_GESTURE_STATE: IdleGestureState = { mode: 'idle' }

export default function useViewerPointerGestures({
  captureZoomAnchorAtClientPoint,
  nextPage,
  onCenterTap,
  prevPage,
  zoomToAnchor,
}: Params) {
  const getOrientation = useReaderStore((state) => state.getOrientation)
  const getBrightness = useReaderSessionStore((state) => state.getBrightness)
  const setBrightness = useReaderSessionStore((state) => state.setBrightness)
  const getZoomLevel = useReaderSessionStore((state) => state.getZoomLevel)

  const activePointersRef = useRef(new Map<number, GesturePointer>())
  const consumedPointerIdsRef = useRef(new Set<number>())
  const gestureRef = useRef<ViewerGestureState>(IDLE_GESTURE_STATE)
  const ignoredPointerIdsRef = useRef(new Set<number>())
  const pendingTouchTapRef = useRef<PendingTouchTap | null>(null)
  const previousTouchTapRef = useRef<PreviousTouchTap | null>(null)

  function resetGesture() {
    gestureRef.current = IDLE_GESTURE_STATE
  }

  function consumePointerIds(pointerIds: readonly number[]) {
    for (const pointerId of pointerIds) {
      consumedPointerIdsRef.current.add(pointerId)
    }
  }

  function clearPendingTouchTap() {
    if (pendingTouchTapRef.current) {
      clearTimeout(pendingTouchTapRef.current.timeoutId)
      pendingTouchTapRef.current = null
    }

    previousTouchTapRef.current = null
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

  function getScrollPanAxes(scrollableAxes: ScrollableAxes, diffX: number, diffY: number): ScrollableAxes | null {
    const absX = Math.abs(diffX)
    const absY = Math.abs(diffY)
    const canScrollX = canScrollAxis(scrollableAxes, 'x')
    const canScrollY = canScrollAxis(scrollableAxes, 'y')

    if (absX < SCROLL_PAN_INTENT_THRESHOLD && absY < SCROLL_PAN_INTENT_THRESHOLD) {
      return null
    }

    if (canScrollX && canScrollY) {
      return { x: true, y: true }
    }

    if (canScrollX && absX >= SCROLL_PAN_INTENT_THRESHOLD && absX > absY * DIRECTION_LOCK_RATIO) {
      return { x: true, y: false }
    }

    if (canScrollY && absY >= SCROLL_PAN_INTENT_THRESHOLD && absY > absX * DIRECTION_LOCK_RATIO) {
      return { x: false, y: true }
    }

    return null
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

    previousTouchTapRef.current = {
      time: performance.now(),
      x: clientX,
      y: clientY,
    }

    const timeoutId = setTimeout(() => {
      const pendingTouchTap = pendingTouchTapRef.current
      pendingTouchTapRef.current = null
      previousTouchTapRef.current = null

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

  function runPointerTap(e: PointerEvent<HTMLDivElement>) {
    runTapAction({
      clientX: e.clientX,
      clientY: e.clientY,
      target: e.currentTarget,
    })
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

    clearPendingTouchTap()

    gestureRef.current = {
      active: false,
      anchor,
      mode: 'one-finger-zoom',
      pointerId: e.pointerId,
      startY: e.clientY,
      startZoom,
    }

    capturePointer(e.currentTarget, e.pointerId)
    claimPointerEvent(e)

    return true
  }

  function cancelOneFingerZoom(e: PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current

    if (gesture.mode !== 'one-finger-zoom') {
      return
    }

    resetGesture()
    releasePointerCapture(e.currentTarget, gesture.pointerId)
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

    clearPendingTouchTap()
    cancelOneFingerZoom(e)

    gestureRef.current = {
      anchor,
      mode: 'pinch',
      pointerIds: [firstId, secondId],
      startDistance,
      startZoom,
    }

    consumePointerIds([firstId, secondId])
    capturePointer(e.currentTarget, firstId)
    capturePointer(e.currentTarget, secondId)
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
    const gesture = gestureRef.current

    if (gesture.mode !== 'pinch' || !gesture.pointerIds.includes(e.pointerId)) {
      return false
    }

    const first = activePointersRef.current.get(gesture.pointerIds[0])
    const second = activePointersRef.current.get(gesture.pointerIds[1])

    if (!first || !second) {
      return false
    }

    claimPointerEvent(e)

    const center = getMidpoint(first, second)

    zoomToAnchor(
      moveZoomAnchorToClientPoint({
        anchor: gesture.anchor,
        clientX: center.clientX,
        clientY: center.clientY,
        viewportRect: e.currentTarget.getBoundingClientRect(),
      }),
      getNextPinchZoomLevel({
        currentDistance: getDistance(first, second),
        startDistance: gesture.startDistance,
        startZoom: gesture.startZoom,
      }),
    )

    return true
  }

  function handleScrollPanMove(e: PointerEvent<HTMLDivElement>) {
    const gesture = gestureRef.current

    if (gesture.mode !== 'pan' || gesture.pointerId !== e.pointerId) {
      return false
    }

    const diffX = e.clientX - gesture.lastX
    const diffY = e.clientY - gesture.lastY

    if (!gesture.active && Math.hypot(diffX, diffY) < PAN_ACTIVATION_THRESHOLD) {
      return true
    }

    gestureRef.current = {
      ...gesture,
      active: true,
      lastX: e.clientX,
      lastY: e.clientY,
    }

    if (gesture.axes.x) {
      e.currentTarget.scrollLeft -= diffX
    }

    if (gesture.axes.y) {
      e.currentTarget.scrollTop -= diffY
    }

    claimPointerEvent(e)

    return true
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    const isIgnoredNonPrimaryPointer = !e.isPrimary && e.pointerType !== 'touch'

    if (
      isIgnoredNonPrimaryPointer ||
      (e.pointerType === 'mouse' && e.button !== 0) ||
      shouldIgnoreViewerGestureTarget(e.target)
    ) {
      ignoredPointerIdsRef.current.add(e.pointerId)
      clearPendingTouchTap()
      return
    }

    activePointersRef.current.set(e.pointerId, {
      clientX: e.clientX,
      clientY: e.clientY,
      pointerType: e.pointerType,
    })

    if (e.pointerType === 'touch' && isDoubleTapStart(e)) {
      if (startOneFingerZoom(e)) {
        return
      }

      clearPendingTouchTap()
      claimPointerEvent(e)
      return
    }

    if (activePointersRef.current.size > 1) {
      startPinch(e)
      return
    }

    if (getZoomLevel() > DEFAULT_ZOOM) {
      gestureRef.current = {
        active: false,
        axes: getScrollableAxesInPath(e.target, e.currentTarget),
        lastX: e.clientX,
        lastY: e.clientY,
        mode: 'pan',
        pointerId: e.pointerId,
        pointerType: e.pointerType,
        startX: e.clientX,
        startY: e.clientY,
      }

      capturePointer(e.currentTarget, e.pointerId)
      return
    }

    gestureRef.current = {
      initialBrightness: getBrightness(),
      mode: 'observing',
      pointerId: e.pointerId,
      pointerType: e.pointerType,
      scrollableAxes: getScrollableAxesInPath(e.target, e.currentTarget),
      startX: e.clientX,
      startY: e.clientY,
    }
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    if (ignoredPointerIdsRef.current.has(e.pointerId)) {
      return
    }

    updatePointer(e)

    const gesture = gestureRef.current

    if (gesture.mode === 'one-finger-zoom' && gesture.pointerId === e.pointerId) {
      claimPointerEvent(e)

      if (activePointersRef.current.size > 1) {
        cancelOneFingerZoom(e)
        return
      }

      const dragDeltaY = e.clientY - gesture.startY

      if (!gesture.active && Math.abs(dragDeltaY) < ONE_FINGER_ZOOM_ACTIVATION_THRESHOLD) {
        return
      }

      gestureRef.current = {
        ...gesture,
        active: true,
      }

      zoomToAnchor(gesture.anchor, getNextOneFingerZoomLevel(gesture.startZoom, dragDeltaY))
      return
    }

    if (handlePinchMove(e)) {
      return
    }

    if (handleScrollPanMove(e)) {
      return
    }

    const nextGesture = gestureRef.current

    if (
      nextGesture.mode !== 'observing' ||
      nextGesture.pointerId !== e.pointerId ||
      !isDirectManipulationPointer(nextGesture.pointerType) ||
      getZoomLevel() > DEFAULT_ZOOM
    ) {
      return
    }

    if (activePointersRef.current.size > 1) {
      return
    }

    const diffX = e.clientX - nextGesture.startX
    const diffY = e.clientY - nextGesture.startY
    const scrollPanAxes = getScrollPanAxes(nextGesture.scrollableAxes, diffX, diffY)

    if (scrollPanAxes) {
      gestureRef.current = {
        active: false,
        axes: scrollPanAxes,
        lastX: nextGesture.startX,
        lastY: nextGesture.startY,
        mode: 'pan',
        pointerId: e.pointerId,
        pointerType: nextGesture.pointerType,
        startX: nextGesture.startX,
        startY: nextGesture.startY,
      }

      clearPendingTouchTap()
      capturePointer(e.currentTarget, e.pointerId)
      handleScrollPanMove(e)
      return
    }

    const isVerticalSwipe =
      Math.abs(diffY) > VERTICAL_BRIGHTNESS_THRESHOLD && Math.abs(diffY) > Math.abs(diffX) * DIRECTION_LOCK_RATIO

    if (!isVerticalSwipe) {
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const deltaBrightness = (diffY / (rect.height / 2)) * 90
    setBrightness(nextGesture.initialBrightness - deltaBrightness)
    claimPointerEvent(e)
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    if (ignoredPointerIdsRef.current.delete(e.pointerId)) {
      return
    }

    activePointersRef.current.delete(e.pointerId)
    const wasPointerConsumed = consumedPointerIdsRef.current.delete(e.pointerId)
    const gesture = gestureRef.current

    if (gesture.mode === 'one-finger-zoom' && gesture.pointerId === e.pointerId) {
      claimPointerEvent(e)
      releasePointerCapture(e.currentTarget, e.pointerId)
      resetGesture()

      if (!gesture.active) {
        const nextZoom = getZoomLevel() > DEFAULT_ZOOM ? DEFAULT_ZOOM : DOUBLE_TAP_ZOOM_LEVEL
        zoomToAnchor(gesture.anchor, nextZoom)
      }

      return
    }

    if (gesture.mode === 'pinch' && gesture.pointerIds.includes(e.pointerId)) {
      resetGesture()
      releasePointerCapture(e.currentTarget, gesture.pointerIds[0])
      releasePointerCapture(e.currentTarget, gesture.pointerIds[1])
      claimPointerEvent(e)

      const remainingPointer = [...activePointersRef.current.entries()][0]

      if (remainingPointer && getZoomLevel() > DEFAULT_ZOOM) {
        const [pointerId, pointer] = remainingPointer

        gestureRef.current = {
          active: false,
          axes: getScrollableAxesInPath(e.target, e.currentTarget),
          lastX: pointer.clientX,
          lastY: pointer.clientY,
          mode: 'pan',
          pointerId,
          pointerType: pointer.pointerType,
          startX: pointer.clientX,
          startY: pointer.clientY,
        }

        capturePointer(e.currentTarget, pointerId)
      }

      return
    }

    if (gesture.mode === 'pan' && gesture.pointerId === e.pointerId) {
      resetGesture()
      releasePointerCapture(e.currentTarget, e.pointerId)

      const diffX = e.clientX - gesture.startX
      const diffY = e.clientY - gesture.startY
      const isTouchTap = gesture.pointerType === 'touch' && isTapMovement(diffX, diffY)

      if (gesture.active || wasPointerConsumed) {
        claimPointerEvent(e)
      } else if (isTouchTap) {
        queueTouchTap(e.clientX, e.clientY, e.currentTarget)
      } else if (isTapMovement(diffX, diffY)) {
        runPointerTap(e)
      }

      return
    }

    if (gesture.mode !== 'observing' || gesture.pointerId !== e.pointerId) {
      if (wasPointerConsumed) {
        claimPointerEvent(e)
      }

      return
    }

    const diffX = e.clientX - gesture.startX
    const diffY = e.clientY - gesture.startY
    const isTouchTap = gesture.pointerType === 'touch' && isTapMovement(diffX, diffY)
    const isDirectManipulation = isDirectManipulationPointer(gesture.pointerType)

    if (wasPointerConsumed) {
      resetGesture()
      claimPointerEvent(e)
      return
    }

    if (getZoomLevel() > DEFAULT_ZOOM) {
      resetGesture()
      if (isTouchTap) {
        queueTouchTap(e.clientX, e.clientY, e.currentTarget)
      }
      return
    }

    if (!isDirectManipulation && !isTapMovement(diffX, diffY)) {
      resetGesture()
      return
    }

    const isVerticalBrightnessSwipe =
      isDirectManipulation &&
      Math.abs(diffY) > VERTICAL_BRIGHTNESS_THRESHOLD &&
      Math.abs(diffY) > Math.abs(diffX) * DIRECTION_LOCK_RATIO

    if (isVerticalBrightnessSwipe) {
      resetGesture()
      return
    }

    const isHorizontalPageSwipe =
      isDirectManipulation &&
      Math.abs(diffX) > HORIZONTAL_SWIPE_THRESHOLD &&
      Math.abs(diffX) > Math.abs(diffY) * DIRECTION_LOCK_RATIO

    if (isHorizontalPageSwipe) {
      if (isScreenEdge(gesture.startX)) {
        resetGesture()
        return
      }

      if (canScrollAxis(gesture.scrollableAxes, 'x')) {
        resetGesture()
        return
      }

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

    resetGesture()

    if (isTouchTap) {
      queueTouchTap(e.clientX, e.clientY, e.currentTarget)
    } else if (isTapMovement(diffX, diffY)) {
      runPointerTap(e)
    }
  }

  function handlePointerCancel(e: PointerEvent<HTMLDivElement>) {
    ignoredPointerIdsRef.current.delete(e.pointerId)
    activePointersRef.current.delete(e.pointerId)
    consumedPointerIdsRef.current.delete(e.pointerId)

    const gesture = gestureRef.current

    if (gesture.mode === 'one-finger-zoom' && gesture.pointerId === e.pointerId) {
      releasePointerCapture(e.currentTarget, gesture.pointerId)
      resetGesture()
      return
    }

    if (gesture.mode === 'pinch' && gesture.pointerIds.includes(e.pointerId)) {
      releasePointerCapture(e.currentTarget, gesture.pointerIds[0])
      releasePointerCapture(e.currentTarget, gesture.pointerIds[1])
      resetGesture()
      return
    }

    if (gesture.mode === 'pan' && gesture.pointerId === e.pointerId) {
      releasePointerCapture(e.currentTarget, gesture.pointerId)
      resetGesture()
      return
    }

    if (gesture.mode === 'observing' && gesture.pointerId === e.pointerId) {
      resetGesture()
    }
  }

  useEffect(() => {
    return () => {
      if (pendingTouchTapRef.current) {
        clearTimeout(pendingTouchTapRef.current.timeoutId)
        pendingTouchTapRef.current = null
      }
    }
  }, [])

  return {
    handlePointerCancel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
