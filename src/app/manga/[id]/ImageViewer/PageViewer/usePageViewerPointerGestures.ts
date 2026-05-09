import { type MouseEvent, type PointerEvent, type RefObject, useRef } from 'react'

import { useBrightnessStore } from '../store/brightness'
import { useOrientationStore } from '../store/orientation'
import { DEFAULT_ZOOM, useZoomStore } from '../store/zoom'

const HORIZONTAL_SWIPE_THRESHOLD = 50 // 가로 스와이프 임계값 (px)
const VERTICAL_SWIPE_THRESHOLD = 10 // 세로 스와이프 임계값 (px)
const EDGE_CLICK_THRESHOLD = 1 / 3 // 화면 3등분 시의 경계값
const SCREEN_EDGE_THRESHOLD = 40 // 브라우저 제스처 감지를 위한 화면 가장자리 임계값 (px)

type Params = {
  nextPage: () => void
  onClick: () => void
  prevPage: () => void
  scrollRef: RefObject<HTMLDivElement | null>
}

export default function usePageViewerPointerNavigation({ nextPage, onClick, prevPage, scrollRef }: Params) {
  const getOrientation = useOrientationStore((state) => state.getOrientation)
  const getBrightness = useBrightnessStore((state) => state.getBrightness)
  const setBrightness = useBrightnessStore((state) => state.setBrightness)
  const getZoomLevel = useZoomStore((state) => state.getZoomLevel)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const initialBrightnessRef = useRef(100)
  const swipeDetectedRef = useRef(false)
  const activePointers = useRef(new Set<number>())

  function handlePointerDown(e: PointerEvent) {
    const isEdgeSwipe = e.clientX < SCREEN_EDGE_THRESHOLD || e.clientX > window.innerWidth - SCREEN_EDGE_THRESHOLD
    if (isEdgeSwipe) return

    initialBrightnessRef.current = getBrightness()
    swipeDetectedRef.current = false
    activePointers.current.add(e.pointerId)
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
  }

  function handlePointerMove(e: PointerEvent) {
    if (!pointerStartRef.current) return

    // 줌 상태일 때는 밝기 조절 방지
    if (getZoomLevel() > DEFAULT_ZOOM) return

    const isPinching = activePointers.current.size > 1
    if (isPinching) return

    const isVerticalScrollable = scrollRef.current && scrollRef.current.scrollHeight > scrollRef.current.clientHeight
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

  function handlePointerUp(e: PointerEvent) {
    activePointers.current.delete(e.pointerId)

    // 줌 상태일 때는 스와이프로 페이지 넘기기 방지
    if (getZoomLevel() > DEFAULT_ZOOM) {
      pointerStartRef.current = null
      return
    }

    const isHorizontalScrollable = scrollRef.current && scrollRef.current.scrollHeight < scrollRef.current.clientHeight
    if (isHorizontalScrollable) return

    // 세로 스와이프가 감지되었으면 페이지 전환 없이 종료
    if (!pointerStartRef.current) return
    const diffX = e.clientX - pointerStartRef.current.x
    const diffY = e.clientY - pointerStartRef.current.y
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
  }

  function handlePointerCancel(e: PointerEvent) {
    activePointers.current.delete(e.pointerId)
  }

  function handleClick(e: MouseEvent) {
    if (swipeDetectedRef.current) {
      swipeDetectedRef.current = false
      return
    }

    // 줌 상태일 때는 onClick만 실행
    if (getZoomLevel() > DEFAULT_ZOOM) {
      onClick()
      return
    }

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const orientation = getOrientation()

    if (orientation === 'horizontal') {
      const clickX = e.clientX - rect.left
      if (clickX < rect.width * EDGE_CLICK_THRESHOLD) {
        prevPage()
      } else if (clickX > rect.width * (1 - EDGE_CLICK_THRESHOLD)) {
        nextPage()
      } else {
        onClick()
      }
    } else if (orientation === 'horizontal-reverse') {
      const clickX = e.clientX - rect.left
      if (clickX < rect.width * EDGE_CLICK_THRESHOLD) {
        nextPage()
      } else if (clickX > rect.width * (1 - EDGE_CLICK_THRESHOLD)) {
        prevPage()
      } else {
        onClick()
      }
    } else if (orientation === 'vertical') {
      const clickY = e.clientY - rect.top
      if (clickY < rect.height * EDGE_CLICK_THRESHOLD) {
        prevPage()
      } else if (clickY > rect.height * (1 - EDGE_CLICK_THRESHOLD)) {
        nextPage()
      } else {
        onClick()
      }
    } else if (orientation === 'vertical-reverse') {
      const clickY = e.clientY - rect.top
      if (clickY < rect.height * EDGE_CLICK_THRESHOLD) {
        nextPage()
      } else if (clickY > rect.height * (1 - EDGE_CLICK_THRESHOLD)) {
        prevPage()
      } else {
        onClick()
      }
    }
  }

  return {
    handleClick,
    handlePointerCancel,
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
  }
}
