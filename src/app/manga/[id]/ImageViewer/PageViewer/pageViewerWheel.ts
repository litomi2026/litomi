import { type Orientation } from '../store/orientation'

export const WHEEL_EVENT_HANDLED = 'handled'
export const WHEEL_EVENT_IGNORED = 'ignored'

export type WheelHandlerResult = typeof WHEEL_EVENT_HANDLED | typeof WHEEL_EVENT_IGNORED

export type WheelNavigationIntent = {
  axis: WheelAxis
  direction: WheelDirection
}

type PageNavigation = 'next' | 'prev'

type ScrollMetrics = {
  clientHeight: number
  clientWidth: number
  scrollHeight: number
  scrollLeft: number
  scrollTop: number
  scrollWidth: number
}

type WheelAxis = 'horizontal' | 'vertical'
type WheelDirection = 'negative' | 'positive'

const WHEEL_BOUNDARY_TOLERANCE = 1
const WHEEL_NAVIGATION_DELTA_THRESHOLD = 12

export function checkNavigatePageFromWheelBoundary(intent: WheelNavigationIntent, scrollMetrics: ScrollMetrics) {
  if (intent.axis === 'vertical') {
    const isScrollable = scrollMetrics.scrollHeight > scrollMetrics.clientHeight
    const isAtTop = scrollMetrics.scrollTop <= 0
    const isAtBottom =
      scrollMetrics.scrollTop + scrollMetrics.clientHeight >= scrollMetrics.scrollHeight - WHEEL_BOUNDARY_TOLERANCE

    return !isScrollable || (intent.direction === 'positive' ? isAtBottom : isAtTop)
  }

  const isScrollable = scrollMetrics.scrollWidth > scrollMetrics.clientWidth
  const isAtLeft = scrollMetrics.scrollLeft <= 0
  const isAtRight =
    scrollMetrics.scrollLeft + scrollMetrics.clientWidth >= scrollMetrics.scrollWidth - WHEEL_BOUNDARY_TOLERANCE

  return !isScrollable || (intent.direction === 'positive' ? isAtRight : isAtLeft)
}

export function getWheelNavigationIntent({
  deltaX,
  deltaY,
}: Pick<WheelEvent, 'deltaX' | 'deltaY'>): WheelNavigationIntent | null {
  const axis = Math.abs(deltaY) >= Math.abs(deltaX) ? 'vertical' : 'horizontal'
  const delta = axis === 'vertical' ? deltaY : deltaX

  if (delta > WHEEL_NAVIGATION_DELTA_THRESHOLD) {
    return { axis, direction: 'positive' }
  }

  if (delta < -WHEEL_NAVIGATION_DELTA_THRESHOLD) {
    return { axis, direction: 'negative' }
  }

  return null
}

export function getWheelPageNavigation(intent: WheelNavigationIntent, orientation: Orientation): PageNavigation {
  const isReverse = orientation === 'horizontal-reverse' || orientation === 'vertical-reverse'
  const isPositiveDirection = intent.direction === 'positive'

  if (isReverse) {
    return isPositiveDirection ? 'prev' : 'next'
  }

  return isPositiveDirection ? 'next' : 'prev'
}
