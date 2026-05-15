const DOM_DELTA_LINE = 1
const DOM_DELTA_PAGE = 2
const LINE_DELTA_PIXELS = 16
const PAGE_DELTA_PIXELS = 800
const FINE_WHEEL_ZOOM_SPEED = 0.04
const COARSE_WHEEL_ZOOM_SPEED = 0.002
const COARSE_WHEEL_DELTA = 10
const MAX_NORMALIZED_WHEEL_DELTA = 50
const ONE_FINGER_ZOOM_SPEED = 0.01
const MIN_PINCH_DISTANCE = 24

export const DOUBLE_TAP_ZOOM_LEVEL = 2

export type ZoomAnchor = {
  contentLeft: number
  contentTop: number
  contentX: number
  contentY: number
  viewportX: number
  viewportY: number
}

type CaptureZoomAnchorParams = {
  clientX: number
  clientY: number
  contentRect: RectLike
  currentZoom: number
  scrollLeft: number
  scrollTop: number
  viewportRect: RectLike
}

type MoveZoomAnchorToClientPointParams = {
  anchor: ZoomAnchor
  clientX: number
  clientY: number
  viewportRect: RectLike
}

type PinchZoomParams = {
  currentDistance: number
  startDistance: number
  startZoom: number
}

type PointerLike = {
  clientX: number
  clientY: number
}

type RectLike = Pick<DOMRectReadOnly, 'left' | 'top'>

type WheelDeltaParams = Pick<WheelEvent, 'deltaMode'> & {
  delta: number
}

type WheelZoomParams = Pick<WheelEvent, 'deltaMode' | 'deltaY'>

export function captureZoomAnchor({
  clientX,
  clientY,
  contentRect,
  currentZoom,
  scrollLeft,
  scrollTop,
  viewportRect,
}: CaptureZoomAnchorParams): ZoomAnchor {
  const viewportX = clientX - viewportRect.left
  const viewportY = clientY - viewportRect.top
  const contentLeft = contentRect.left - viewportRect.left + scrollLeft
  const contentTop = contentRect.top - viewportRect.top + scrollTop

  return {
    contentLeft,
    contentTop,
    contentX: (scrollLeft + viewportX - contentLeft) / currentZoom,
    contentY: (scrollTop + viewportY - contentTop) / currentZoom,
    viewportX,
    viewportY,
  }
}

export function getDistance(first: PointerLike, second: PointerLike) {
  return Math.hypot(first.clientX - second.clientX, first.clientY - second.clientY)
}

export function getMidpoint(first: PointerLike, second: PointerLike) {
  return {
    clientX: (first.clientX + second.clientX) / 2,
    clientY: (first.clientY + second.clientY) / 2,
  }
}

export function getNextOneFingerZoomLevel(startZoom: number, dragDeltaY: number) {
  return startZoom * Math.exp(dragDeltaY * ONE_FINGER_ZOOM_SPEED)
}

export function getNextPinchZoomLevel({ currentDistance, startDistance, startZoom }: PinchZoomParams) {
  if (startDistance < MIN_PINCH_DISTANCE) {
    return startZoom
  }

  return startZoom * (currentDistance / startDistance)
}

export function getNextWheelZoomLevel(currentZoom: number, wheel: WheelZoomParams) {
  const normalizedDeltaY = getNormalizedWheelDelta({
    delta: wheel.deltaY,
    deltaMode: wheel.deltaMode,
  })

  const clampedDeltaY = Math.max(-MAX_NORMALIZED_WHEEL_DELTA, Math.min(normalizedDeltaY, MAX_NORMALIZED_WHEEL_DELTA))
  const speed = getAdaptiveWheelZoomSpeed(clampedDeltaY)
  return currentZoom * Math.exp(-clampedDeltaY * speed)
}

export function getNormalizedWheelDelta({ delta, deltaMode }: WheelDeltaParams) {
  if (deltaMode === DOM_DELTA_LINE) {
    return delta * LINE_DELTA_PIXELS
  }

  if (deltaMode === DOM_DELTA_PAGE) {
    return delta * PAGE_DELTA_PIXELS
  }

  return delta
}

export function moveZoomAnchorToClientPoint({
  anchor,
  clientX,
  clientY,
  viewportRect,
}: MoveZoomAnchorToClientPointParams): ZoomAnchor {
  return {
    ...anchor,
    viewportX: clientX - viewportRect.left,
    viewportY: clientY - viewportRect.top,
  }
}

function getAdaptiveWheelZoomSpeed(deltaY: number) {
  const normalizedMagnitude = Math.min(Math.abs(deltaY), COARSE_WHEEL_DELTA) / COARSE_WHEEL_DELTA
  return FINE_WHEEL_ZOOM_SPEED + (COARSE_WHEEL_ZOOM_SPEED - FINE_WHEEL_ZOOM_SPEED) * normalizedMagnitude
}
