import { describe, expect, it } from 'bun:test'

import {
  canNavigatePageFromWheelBoundary,
  getWheelNavigationIntent,
  getWheelPageNavigation,
} from './pageViewerWheel'

describe('pageViewerWheel', () => {
  it('dominant wheel 축과 방향을 계산한다', () => {
    expect(getWheelNavigationIntent({ deltaX: 0, deltaY: 2 })).toEqual({
      axis: 'vertical',
      direction: 'positive',
    })
    expect(getWheelNavigationIntent({ deltaX: -3, deltaY: 1 })).toEqual({
      axis: 'horizontal',
      direction: 'negative',
    })
  })

  it('threshold 이하의 wheel 입력은 페이지 이동으로 보지 않는다', () => {
    expect(getWheelNavigationIntent({ deltaX: 0, deltaY: 1 })).toBeNull()
    expect(getWheelNavigationIntent({ deltaX: -1, deltaY: 0 })).toBeNull()
  })

  it('기본 방향에서는 positive wheel을 다음 페이지로 해석한다', () => {
    expect(getWheelPageNavigation({ axis: 'vertical', direction: 'positive' }, 'vertical')).toBe('next')
    expect(getWheelPageNavigation({ axis: 'horizontal', direction: 'negative' }, 'horizontal')).toBe('prev')
  })

  it('reverse 방향에서는 wheel 페이지 이동을 반대로 해석한다', () => {
    expect(getWheelPageNavigation({ axis: 'vertical', direction: 'positive' }, 'vertical-reverse')).toBe('prev')
    expect(getWheelPageNavigation({ axis: 'horizontal', direction: 'negative' }, 'horizontal-reverse')).toBe('next')
  })

  it('scroll 가능한 축의 중간에서는 페이지 이동을 막는다', () => {
    expect(
      canNavigatePageFromWheelBoundary(
        { axis: 'vertical', direction: 'positive' },
        {
          clientHeight: 100,
          clientWidth: 100,
          scrollHeight: 300,
          scrollLeft: 0,
          scrollTop: 50,
          scrollWidth: 100,
        },
      ),
    ).toBe(false)

    expect(
      canNavigatePageFromWheelBoundary(
        { axis: 'horizontal', direction: 'negative' },
        {
          clientHeight: 100,
          clientWidth: 100,
          scrollHeight: 100,
          scrollLeft: 50,
          scrollTop: 0,
          scrollWidth: 300,
        },
      ),
    ).toBe(false)
  })

  it('scroll 경계에서는 페이지 이동을 허용한다', () => {
    expect(
      canNavigatePageFromWheelBoundary(
        { axis: 'vertical', direction: 'positive' },
        {
          clientHeight: 100,
          clientWidth: 100,
          scrollHeight: 300,
          scrollLeft: 0,
          scrollTop: 200,
          scrollWidth: 100,
        },
      ),
    ).toBe(true)

    expect(
      canNavigatePageFromWheelBoundary(
        { axis: 'horizontal', direction: 'negative' },
        {
          clientHeight: 100,
          clientWidth: 100,
          scrollHeight: 100,
          scrollLeft: 0,
          scrollTop: 0,
          scrollWidth: 300,
        },
      ),
    ).toBe(true)
  })
})
