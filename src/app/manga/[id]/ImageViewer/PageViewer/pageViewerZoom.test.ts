import '@test/setup.dom'
import { describe, expect, test } from 'bun:test'

import { DEFAULT_ZOOM, MAX_ZOOM } from '../store/zoom'
import { captureCursorZoomAnchor, getCursorAnchoredScrollPosition, getNextWheelZoomLevel } from './pageViewerZoom'

function getAnchoredClientPosition({
  contentLeft,
  contentTop,
  contentX,
  contentY,
  scrollLeft,
  scrollTop,
  viewportLeft,
  viewportTop,
  zoom,
}: {
  contentLeft: number
  contentTop: number
  contentX: number
  contentY: number
  scrollLeft: number
  scrollTop: number
  viewportLeft: number
  viewportTop: number
  zoom: number
}) {
  return {
    x: viewportLeft + contentLeft - scrollLeft + contentX * zoom,
    y: viewportTop + contentTop - scrollTop + contentY * zoom,
  }
}

describe('pageViewerZoom', () => {
  test('1x에서 2x로 확대해도 커서 아래 콘텐츠 좌표를 유지한다', () => {
    const clientX = 400
    const clientY = 300
    const anchor = captureCursorZoomAnchor({
      clientX,
      clientY,
      contentRect: { left: 0, top: 0 },
      currentZoom: 1,
      scrollLeft: 0,
      scrollTop: 0,
      viewportRect: { left: 0, top: 0 },
    })

    const scrollPosition = getCursorAnchoredScrollPosition({ anchor, nextZoom: 2 })
    const anchoredClientPosition = getAnchoredClientPosition({
      ...anchor,
      scrollLeft: scrollPosition.left,
      scrollTop: scrollPosition.top,
      viewportLeft: 0,
      viewportTop: 0,
      zoom: 2,
    })

    expect(scrollPosition).toEqual({ left: 400, top: 300 })
    expect(anchoredClientPosition.x).toBeCloseTo(clientX)
    expect(anchoredClientPosition.y).toBeCloseTo(clientY)
  })

  test('기존 스크롤과 밀린 콘텐츠 rect를 함께 반영한다', () => {
    const clientX = 260
    const clientY = 210
    const viewportRect = { left: 100, top: 40 }
    const anchor = captureCursorZoomAnchor({
      clientX,
      clientY,
      contentRect: { left: 70, top: 10 },
      currentZoom: 1.5,
      scrollLeft: 80,
      scrollTop: 120,
      viewportRect,
    })

    const nextZoom = 2.25
    const scrollPosition = getCursorAnchoredScrollPosition({ anchor, nextZoom })
    const anchoredClientPosition = getAnchoredClientPosition({
      ...anchor,
      scrollLeft: scrollPosition.left,
      scrollTop: scrollPosition.top,
      viewportLeft: viewportRect.left,
      viewportTop: viewportRect.top,
      zoom: nextZoom,
    })

    expect(anchoredClientPosition.x).toBeCloseTo(clientX)
    expect(anchoredClientPosition.y).toBeCloseTo(clientY)
  })

  test('휠 줌 계산은 기본/최대 줌 범위로 clamp한다', () => {
    expect(getNextWheelZoomLevel(DEFAULT_ZOOM, 500)).toBe(DEFAULT_ZOOM)
    expect(getNextWheelZoomLevel(MAX_ZOOM, -500)).toBe(MAX_ZOOM)
  })
})
