import { clampZoomLevel } from '../store/zoom'

const DOM_DELTA_LINE = 1
const DOM_DELTA_PAGE = 2
const LINE_DELTA_PIXELS = 16
const PAGE_DELTA_PIXELS = 800
const FINE_WHEEL_ZOOM_SPEED = 0.04
const COARSE_WHEEL_ZOOM_SPEED = 0.002
const COARSE_WHEEL_DELTA = 10
const MAX_NORMALIZED_WHEEL_DELTA = 50
const ONE_FINGER_ZOOM_SPEED = 0.01

export const DOUBLE_TAP_ZOOM_LEVEL = 2

export type CursorZoomAnchor = {
  contentLeft: number
  contentTop: number
  contentX: number
  contentY: number
  viewportX: number
  viewportY: number
}

type CaptureCursorZoomAnchorParams = {
  clientX: number
  clientY: number
  contentRect: RectLike
  currentZoom: number
  scrollLeft: number
  scrollTop: number
  viewportRect: RectLike
}

type GetCursorAnchoredScrollPositionParams = {
  anchor: CursorZoomAnchor
  nextZoom: number
}

type RectLike = Pick<DOMRectReadOnly, 'left' | 'top'>
type WheelZoomParams = Pick<WheelEvent, 'deltaMode' | 'deltaY'>

export function captureCursorZoomAnchor({
  clientX,
  clientY,
  contentRect,
  currentZoom,
  scrollLeft,
  scrollTop,
  viewportRect,
}: CaptureCursorZoomAnchorParams): CursorZoomAnchor {
  const zoom = clampZoomLevel(currentZoom)
  const viewportX = clientX - viewportRect.left
  const viewportY = clientY - viewportRect.top
  const contentLeft = contentRect.left - viewportRect.left + scrollLeft
  const contentTop = contentRect.top - viewportRect.top + scrollTop

  return {
    contentLeft,
    contentTop,
    contentX: (scrollLeft + viewportX - contentLeft) / zoom,
    contentY: (scrollTop + viewportY - contentTop) / zoom,
    viewportX,
    viewportY,
  }
}

export function getAdaptiveWheelZoomSpeed(deltaY: number) {
  const normalizedMagnitude = Math.min(Math.abs(deltaY), COARSE_WHEEL_DELTA) / COARSE_WHEEL_DELTA
  return FINE_WHEEL_ZOOM_SPEED + (COARSE_WHEEL_ZOOM_SPEED - FINE_WHEEL_ZOOM_SPEED) * normalizedMagnitude
}

export function getCursorAnchoredScrollPosition({ anchor, nextZoom }: GetCursorAnchoredScrollPositionParams) {
  return {
    left: Math.max(0, anchor.contentLeft + anchor.contentX * nextZoom - anchor.viewportX),
    top: Math.max(0, anchor.contentTop + anchor.contentY * nextZoom - anchor.viewportY),
  }
}

export function getNextOneFingerZoomLevel(startZoom: number, dragDeltaY: number) {
  return clampZoomLevel(startZoom * Math.exp(dragDeltaY * ONE_FINGER_ZOOM_SPEED))
}

export function getNextWheelZoomLevel(currentZoom: number, wheel: WheelZoomParams) {
  const normalizedDeltaY = getNormalizedWheelDeltaY(wheel)
  const clampedDeltaY = Math.max(-MAX_NORMALIZED_WHEEL_DELTA, Math.min(normalizedDeltaY, MAX_NORMALIZED_WHEEL_DELTA))
  const speed = getAdaptiveWheelZoomSpeed(clampedDeltaY)
  return clampZoomLevel(currentZoom * Math.exp(-clampedDeltaY * speed))
}

export function getNormalizedWheelDeltaY({ deltaMode, deltaY }: WheelZoomParams) {
  if (deltaMode === DOM_DELTA_LINE) {
    return deltaY * LINE_DELTA_PIXELS
  }

  if (deltaMode === DOM_DELTA_PAGE) {
    return deltaY * PAGE_DELTA_PIXELS
  }

  return deltaY
}
