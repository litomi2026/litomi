import type { CSSProperties } from 'react'

import { DEFAULT_ZOOM } from '../store/zoom'

const SCREEN_EDGE_THRESHOLD = 40
const SCROLL_OVERFLOW_EPSILON = 1

export type GestureAxis = 'x' | 'y'

export type ScrollableAxes = {
  x: boolean
  y: boolean
}

const NON_SCROLLABLE_AXES: ScrollableAxes = {
  x: false,
  y: false,
}

const VIEWER_GESTURE_IGNORE_SELECTOR = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  '[contenteditable="true"]',
  '[data-viewer-gesture-ignore]',
  '[role="button"]',
  '[role="dialog"]',
  '[role="slider"]',
].join(', ')

export function canScrollAxis(axes: ScrollableAxes, axis: GestureAxis) {
  return axis === 'x' ? axes.x : axes.y
}

export function getScrollableAxesInPath(target: EventTarget | null, boundary: HTMLElement): ScrollableAxes {
  if (!(target instanceof Node)) {
    return getScrollableAxes(boundary)
  }

  let current: Node | null = target
  const axes: ScrollableAxes = {
    x: false,
    y: false,
  }

  while (current) {
    if (current instanceof HTMLElement) {
      const elementAxes = getScrollableAxes(current)
      axes.x ||= elementAxes.x
      axes.y ||= elementAxes.y

      if (current === boundary) {
        break
      }
    }

    current = current.parentNode
  }

  return axes
}

export function getTouchActionForScrollableAxes(axes: ScrollableAxes, zoomLevel: number): CSSProperties['touchAction'] {
  if (zoomLevel > DEFAULT_ZOOM) {
    return 'none'
  }

  if (axes.x && axes.y) {
    return 'pan-x pan-y'
  }

  if (axes.x) {
    return 'pan-x'
  }

  if (axes.y) {
    return 'pan-y'
  }

  return 'none'
}

export function isScreenEdge(clientX: number, viewportWidth = window.innerWidth) {
  return clientX < SCREEN_EDGE_THRESHOLD || clientX > viewportWidth - SCREEN_EDGE_THRESHOLD
}

export function shouldIgnoreViewerGestureTarget(target: EventTarget | null) {
  const element =
    target instanceof Element ? target : target instanceof Node && target.parentElement ? target.parentElement : null

  return Boolean(element?.closest(VIEWER_GESTURE_IGNORE_SELECTOR))
}

function getScrollableAxes(element: HTMLElement): ScrollableAxes {
  const style = window.getComputedStyle(element)
  const x = isScrollableOverflowStyle(style.overflowX) && hasScrollableOverflow(element, 'x')
  const y = isScrollableOverflowStyle(style.overflowY) && hasScrollableOverflow(element, 'y')

  if (!x && !y) {
    return NON_SCROLLABLE_AXES
  }

  return { x, y }
}

function hasScrollableOverflow(element: HTMLElement, axis: GestureAxis) {
  if (axis === 'x') {
    return element.scrollWidth - element.clientWidth > SCROLL_OVERFLOW_EPSILON
  }

  return element.scrollHeight - element.clientHeight > SCROLL_OVERFLOW_EPSILON
}

function isScrollableOverflowStyle(value: string) {
  return value === 'auto' || value === 'scroll' || value === 'overlay'
}
