import { type MouseEvent, type PointerEvent, useEffect, useRef } from 'react'

import { useBrightnessStore } from '../store/brightness'
import { useOrientationStore } from '../store/orientation'
import { DEFAULT_ZOOM, useZoomStore } from '../store/zoom'
import { type CursorZoomAnchor, DOUBLE_TAP_ZOOM_LEVEL, getNextOneFingerZoomLevel } from './pageViewerZoom'

const HORIZONTAL_SWIPE_THRESHOLD = 50 // 가로 스와이프 임계값 (px)
const VERTICAL_SWIPE_THRESHOLD = 10 // 세로 스와이프 임계값 (px)
const EDGE_CLICK_THRESHOLD = 1 / 3 // 화면 3등분 시의 경계값
const SCREEN_EDGE_THRESHOLD = 40 // 브라우저 제스처 감지를 위한 화면 가장자리 임계값 (px)
const TAP_MOVE_THRESHOLD = 10
const DOUBLE_TAP_DELAY = 220
const DOUBLE_TAP_DISTANCE_THRESHOLD = 36
const ONE_FINGER_ZOOM_ACTIVATION_THRESHOLD = 8
const CLICK_SUPPRESSION_TIMEOUT = 1_000

type OneFingerZoomState = {
  active: boolean
  anchor: CursorZoomAnchor
  pointerId: number
  startY: number
  startZoom: number
}

type Params = {
  captureZoomAnchorAtClientPoint: (params: {
    clientX: number
    clientY: number
    currentZoom?: number
  }) => CursorZoomAnchor | null
  nextPage: () => void
  onClick: () => void
  prevPage: () => void
  zoomToAnchor: (anchor: CursorZoomAnchor, nextZoom: number) => boolean
}

type PendingTouchTap = {
  clientX: number
  clientY: number
  target: HTMLElement
  timeoutId: ReturnType<typeof setTimeout>
}

type PointerStart = {
  pointerType: string
  x: number
  y: number
}

type PreviousTouchTap = {
  time: number
  x: number
  y: number
}

type TapAction = 'center' | 'next' | 'prev'

export default function usePageViewerPointerGestures({
  captureZoomAnchorAtClientPoint,
  nextPage,
  onClick,
  prevPage,
  zoomToAnchor,
}: Params) {
  const getOrientation = useOrientationStore((state) => state.getOrientation)
  const getBrightness = useBrightnessStore((state) => state.getBrightness)
  const setBrightness = useBrightnessStore((state) => state.setBrightness)
  const getZoomLevel = useZoomStore((state) => state.getZoomLevel)
  const pointerStartRef = useRef<PointerStart | null>(null)
  const initialBrightnessRef = useRef(100)
  const swipeDetectedRef = useRef(false)
  const activePointers = useRef(new Set<number>())
  const clickSuppressionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const oneFingerZoomRef = useRef<OneFingerZoomState | null>(null)
  const pendingTouchTapRef = useRef<PendingTouchTap | null>(null)
  const previousTouchTapRef = useRef<PreviousTouchTap | null>(null)
  const suppressClickRef = useRef(false)

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

  function clearPendingTouchTap() {
    if (pendingTouchTapRef.current) {
      clearTimeout(pendingTouchTapRef.current.timeoutId)
      pendingTouchTapRef.current = null
    }

    previousTouchTapRef.current = null
  }

  function releasePointerCapture(target: HTMLDivElement, pointerId: number) {
    try {
      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId)
      }
    } catch {
      // The pointer may have been cancelled by the browser before React receives the cleanup event.
    }
  }

  function capturePointer(e: PointerEvent<HTMLDivElement>) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId)
    } catch {
      // The pointer may already be gone on some mobile browser edge cases.
    }
  }

  function claimPointerEvent(e: PointerEvent<HTMLDivElement>) {
    e.preventDefault()
    e.stopPropagation()
  }

  function isTouchPointer(e: PointerEvent<HTMLDivElement>) {
    return e.pointerType === 'touch'
  }

  function isTapMovement(diffX: number, diffY: number) {
    return Math.abs(diffX) <= TAP_MOVE_THRESHOLD && Math.abs(diffY) <= TAP_MOVE_THRESHOLD
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

  function getTapAction(clientX: number, clientY: number, target: HTMLElement): TapAction {
    const rect = target.getBoundingClientRect()
    const orientation = getOrientation()

    if (orientation === 'horizontal') {
      const clickX = clientX - rect.left
      if (clickX < rect.width * EDGE_CLICK_THRESHOLD) return 'prev'
      if (clickX > rect.width * (1 - EDGE_CLICK_THRESHOLD)) return 'next'
      return 'center'
    }

    if (orientation === 'horizontal-reverse') {
      const clickX = clientX - rect.left
      if (clickX < rect.width * EDGE_CLICK_THRESHOLD) return 'next'
      if (clickX > rect.width * (1 - EDGE_CLICK_THRESHOLD)) return 'prev'
      return 'center'
    }

    if (orientation === 'vertical') {
      const clickY = clientY - rect.top
      if (clickY < rect.height * EDGE_CLICK_THRESHOLD) return 'prev'
      if (clickY > rect.height * (1 - EDGE_CLICK_THRESHOLD)) return 'next'
      return 'center'
    }

    if (orientation === 'vertical-reverse') {
      const clickY = clientY - rect.top
      if (clickY < rect.height * EDGE_CLICK_THRESHOLD) return 'next'
      if (clickY > rect.height * (1 - EDGE_CLICK_THRESHOLD)) return 'prev'
    }

    return 'center'
  }

  function isCenterTap(clientX: number, clientY: number, target: HTMLElement) {
    return getTapAction(clientX, clientY, target) === 'center'
  }

  function runTapAction({ clientX, clientY, target }: Omit<PendingTouchTap, 'timeoutId'>) {
    if (!target.isConnected) {
      return
    }

    // 줌 상태일 때는 페이지 넘김 대신 컨트롤 표시만 토글해요.
    if (getZoomLevel() > DEFAULT_ZOOM) {
      onClick()
      return
    }

    const tapAction = getTapAction(clientX, clientY, target)

    if (tapAction === 'prev') {
      prevPage()
    } else if (tapAction === 'next') {
      nextPage()
    } else {
      onClick()
    }
  }

  function runTouchTap(clientX: number, clientY: number, target: HTMLElement) {
    if (isCenterTap(clientX, clientY, target)) {
      queueTouchTap(clientX, clientY, target)
      return
    }

    clearPendingTouchTap()
    suppressNextClick()
    runTapAction({ clientX, clientY, target })
  }

  function queueTouchTap(clientX: number, clientY: number, target: HTMLElement) {
    clearPendingTouchTap()
    suppressNextClick()

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

    oneFingerZoomRef.current = {
      active: false,
      anchor,
      pointerId: e.pointerId,
      startY: e.clientY,
      startZoom,
    }

    pointerStartRef.current = null
    suppressNextClick()
    capturePointer(e)
    claimPointerEvent(e)

    return true
  }

  function cancelOneFingerZoom(e: PointerEvent<HTMLDivElement>) {
    const oneFingerZoom = oneFingerZoomRef.current

    if (!oneFingerZoom) {
      return
    }

    oneFingerZoomRef.current = null
    releasePointerCapture(e.currentTarget, oneFingerZoom.pointerId)
  }

  function handlePointerDown(e: PointerEvent<HTMLDivElement>) {
    activePointers.current.add(e.pointerId)

    if (activePointers.current.size > 1) {
      clearPendingTouchTap()
      cancelOneFingerZoom(e)
      pointerStartRef.current = null
      return
    }

    const isEdgeSwipe = e.clientX < SCREEN_EDGE_THRESHOLD || e.clientX > window.innerWidth - SCREEN_EDGE_THRESHOLD
    if (isEdgeSwipe) return

    if (isTouchPointer(e) && isCenterTap(e.clientX, e.clientY, e.currentTarget) && isDoubleTapStart(e)) {
      if (startOneFingerZoom(e)) {
        return
      }

      clearPendingTouchTap()
      suppressNextClick()
      claimPointerEvent(e)
      return
    }

    initialBrightnessRef.current = getBrightness()
    swipeDetectedRef.current = false
    pointerStartRef.current = { pointerType: e.pointerType, x: e.clientX, y: e.clientY }
  }

  function handlePointerMove(e: PointerEvent<HTMLDivElement>) {
    const oneFingerZoom = oneFingerZoomRef.current
    if (oneFingerZoom?.pointerId === e.pointerId) {
      claimPointerEvent(e)

      if (activePointers.current.size > 1) {
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

    if (!pointerStartRef.current) return

    // 줌 상태일 때는 밝기 조절 방지
    if (getZoomLevel() > DEFAULT_ZOOM) return

    const isPinching = activePointers.current.size > 1
    if (isPinching) return

    const isVerticalScrollable = e.currentTarget.scrollHeight > e.currentTarget.clientHeight
    if (isVerticalScrollable) return

    const diffX = e.clientX - pointerStartRef.current.x
    const diffY = e.clientY - pointerStartRef.current.y
    const isVerticalSwipe = Math.abs(diffY) > VERTICAL_SWIPE_THRESHOLD && Math.abs(diffY) > Math.abs(diffX)
    if (!isVerticalSwipe) return

    swipeDetectedRef.current = true
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const deltaBrightness = (diffY / (rect.height / 2)) * 90
    const newBrightness = initialBrightnessRef.current - deltaBrightness
    if (newBrightness < 10 || newBrightness > 100) return

    setBrightness(newBrightness)
  }

  function handlePointerUp(e: PointerEvent<HTMLDivElement>) {
    activePointers.current.delete(e.pointerId)

    const oneFingerZoom = oneFingerZoomRef.current

    if (oneFingerZoom?.pointerId === e.pointerId) {
      claimPointerEvent(e)
      releasePointerCapture(e.currentTarget, e.pointerId)
      oneFingerZoomRef.current = null
      pointerStartRef.current = null
      suppressNextClick()

      if (!oneFingerZoom.active) {
        const nextZoom = getZoomLevel() > DEFAULT_ZOOM ? DEFAULT_ZOOM : DOUBLE_TAP_ZOOM_LEVEL
        zoomToAnchor(oneFingerZoom.anchor, nextZoom)
      }

      return
    }

    if (!pointerStartRef.current) return

    const diffX = e.clientX - pointerStartRef.current.x
    const diffY = e.clientY - pointerStartRef.current.y
    const isTouchTap = pointerStartRef.current.pointerType === 'touch' && isTapMovement(diffX, diffY)

    // 줌 상태일 때는 스와이프로 페이지 넘기기 방지
    if (getZoomLevel() > DEFAULT_ZOOM) {
      pointerStartRef.current = null
      if (isTouchTap) {
        runTouchTap(e.clientX, e.clientY, e.currentTarget)
      }
      return
    }

    const isHorizontalScrollable = e.currentTarget.scrollHeight < e.currentTarget.clientHeight

    if (isHorizontalScrollable) {
      pointerStartRef.current = null
      if (isTouchTap) {
        runTouchTap(e.clientX, e.clientY, e.currentTarget)
      }
      return
    }

    const isVerticalSwipe = Math.abs(diffY) > VERTICAL_SWIPE_THRESHOLD && Math.abs(diffY) > Math.abs(diffX)

    if (isVerticalSwipe) {
      pointerStartRef.current = null
      return
    }

    if (Math.abs(diffX) > HORIZONTAL_SWIPE_THRESHOLD) {
      swipeDetectedRef.current = true
      const orientation = getOrientation()
      const isReversed = orientation === 'horizontal-reverse' || orientation === 'vertical-reverse'

      if (diffX > 0) {
        if (isReversed) {
          nextPage()
        } else {
          prevPage()
        }
      } else {
        if (isReversed) {
          prevPage()
        } else {
          nextPage()
        }
      }
    }

    pointerStartRef.current = null

    if (isTouchTap) {
      runTouchTap(e.clientX, e.clientY, e.currentTarget)
    }
  }

  function handlePointerCancel(e: PointerEvent<HTMLDivElement>) {
    activePointers.current.delete(e.pointerId)
    cancelOneFingerZoom(e)
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
  }
}
