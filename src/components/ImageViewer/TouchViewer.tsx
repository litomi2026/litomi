'use client'

import { memo, useCallback, useEffect, useRef } from 'react'

import { PageView } from '@/components/ImageViewer/store/pageView'
import { ScreenFit } from '@/components/ImageViewer/store/screenFit'
import { useTouchOrientationStore } from '@/components/ImageViewer/store/touchOrientation'
import useImageNavigation from '@/hook/useImageNavigation'
import { Manga } from '@/types/manga'

import MangaImage from '../MangaImage'
import { useBrightnessStore } from './store/brightness'
import { useImageIndexStore } from './store/imageIndex'

const HORIZONTAL_SWIPE_THRESHOLD = 50 // 가로 스와이프 임계값 (px)
const VERTICAL_SWIPE_THRESHOLD = 10 // 세로 스와이프 임계값 (px)
const EDGE_CLICK_THRESHOLD = 1 / 3 // 화면 3등분 시의 경계값
const IMAGE_PREFETCH_AMOUNT = 6
const IMAGE_FETCH_PRIORITY_THRESHOLD = 3
const SCROLL_THRESHOLD = 1
const SCROLL_THROTTLE = 500
const SCREEN_EDGE_THRESHOLD = 40 // 브라우저 제스처 감지를 위한 화면 가장자리 임계값 (px)

const screenFitStyle = {
  width: `overflow-y-auto [&_li]:mx-auto [&_li]:w-fit [&_li]:max-w-full [&_li]:first:h-full [&_img]:my-auto [&_img]:min-w-0 [&_img]:max-w-fit [&_img]:h-auto`,
  height:
    'overflow-x-auto [&_li]:items-center [&_li]:mx-auto [&_li]:w-fit [&_li]:first:h-full [&_img]:max-w-fit [&_img]:h-auto [&_img]:max-h-dvh',
  all: '[&_li]:items-center [&_li]:mx-auto [&_img]:min-w-0 [&_li]:w-fit [&_li]:h-full [&_img]:max-h-dvh',
}

type Props = {
  manga: Manga
  onClick: () => void
  pageView: PageView
  screenFit: ScreenFit
}

type TouchViewerItemProps = {
  offset: number
  manga: Manga
  pageView: PageView
}

export default memo(TouchViewer)

function TouchViewer({ manga, onClick, screenFit, pageView }: Props) {
  const { images } = manga
  const getTouchOrientation = useTouchOrientationStore((state) => state.getTouchOrientation)
  const getBrightness = useBrightnessStore((state) => state.getBrightness)
  const setBrightness = useBrightnessStore((state) => state.setBrightness)
  const currentIndex = useImageIndexStore((state) => state.imageIndex)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const initialBrightnessRef = useRef(100)
  const swipeDetectedRef = useRef(false)
  const activePointers = useRef(new Set<number>())
  const ulRef = useRef<HTMLUListElement>(null)
  const throttleRef = useRef(false)
  const previousIndexRef = useRef(currentIndex)

  const { prevPage, nextPage } = useImageNavigation({
    maxIndex: images.length - 1,
    offset: pageView === 'double' ? 2 : 1,
  })

  // 포인터 시작 시 좌표, 현재 밝기 기록 및 포인터 ID 등록
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      initialBrightnessRef.current = getBrightness()
      swipeDetectedRef.current = false
      activePointers.current.add(e.pointerId)

      const isEdgeSwipe = e.clientX < SCREEN_EDGE_THRESHOLD || e.clientX > window.innerWidth - SCREEN_EDGE_THRESHOLD
      if (!isEdgeSwipe) {
        pointerStartRef.current = { x: e.clientX, y: e.clientY }
      }
    },
    [getBrightness],
  )

  // 포인터 이동 시: 세로 스와이프 감지 시 밝기 업데이트, 핀치 줌(멀티 터치) 중이면 밝기 조절 방지
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointerStartRef.current) return

      const isPinchZooming = activePointers.current.size > 1
      if (isPinchZooming) return

      const isVerticalScrollable = ulRef.current && ulRef.current.scrollHeight > ulRef.current.clientHeight
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
    },
    [setBrightness],
  )

  // 포인터 종료 시: 포인터 ID 제거 및 스와이프/페이지 전환 처리
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      activePointers.current.delete(e.pointerId)

      if (!pointerStartRef.current) return

      const isHorizontalScrollable = ulRef.current && ulRef.current.scrollHeight < ulRef.current.clientHeight
      if (isHorizontalScrollable) return

      // 세로 스와이프가 감지되었으면 페이지 전환 없이 종료
      const diffX = e.clientX - pointerStartRef.current.x
      const diffY = e.clientY - pointerStartRef.current.y
      const isVerticalSwipe = Math.abs(diffY) > VERTICAL_SWIPE_THRESHOLD && Math.abs(diffY) > Math.abs(diffX)
      if (isVerticalSwipe) {
        pointerStartRef.current = null
        return
      }

      if (Math.abs(diffX) > HORIZONTAL_SWIPE_THRESHOLD) {
        swipeDetectedRef.current = true
        if (diffX > 0) {
          prevPage() // 오른쪽 스와이프
        } else {
          nextPage() // 왼쪽 스와이프
        }
      }

      pointerStartRef.current = null
    },
    [nextPage, prevPage],
  )

  // 포인터 캔슬 시 포인터 ID 제거
  const handlePointerCancel = useCallback((e: React.PointerEvent) => {
    activePointers.current.delete(e.pointerId)
  }, [])

  // 클릭 이벤트: 스와이프 미발생 시 처리
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (swipeDetectedRef.current) {
        swipeDetectedRef.current = false
        return
      }

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const touchOrientation = getTouchOrientation()

      if (touchOrientation === 'horizontal') {
        const clickX = e.clientX - rect.left
        if (clickX < rect.width * EDGE_CLICK_THRESHOLD) {
          prevPage()
        } else if (clickX > rect.width * (1 - EDGE_CLICK_THRESHOLD)) {
          nextPage()
        } else {
          onClick()
        }
      } else if (touchOrientation === 'vertical') {
        const clickY = e.clientY - rect.top
        if (clickY < rect.height * EDGE_CLICK_THRESHOLD) {
          prevPage()
        } else if (clickY > rect.height * (1 - EDGE_CLICK_THRESHOLD)) {
          nextPage()
        } else {
          onClick()
        }
      }
    },
    [getTouchOrientation, nextPage, onClick, prevPage],
  )

  // NOTE: 마우스/터치패드 환경에서 스크롤 시 페이지를 전환함
  useEffect(() => {
    const handleWheel = ({ deltaX, deltaY }: WheelEvent) => {
      if (throttleRef.current) return

      throttleRef.current = true
      setTimeout(() => {
        throttleRef.current = false
      }, SCROLL_THROTTLE)

      const ul = ulRef.current
      if (!ul) return

      const isVerticallyScrollable = ul.scrollHeight > ul.clientHeight
      const isHorizontallyScrollable = ul.scrollWidth > ul.clientWidth
      const atTop = ul.scrollTop <= 0
      const atBottom = ul.scrollTop + ul.clientHeight >= ul.scrollHeight - 1
      const atLeft = ul.scrollLeft <= 0
      const atRight = ul.scrollLeft + ul.clientWidth >= ul.scrollWidth - 1

      if (Math.abs(deltaY) >= Math.abs(deltaX)) {
        if (isVerticallyScrollable && !((deltaY > 0 && atBottom) || (deltaY < 0 && atTop))) {
          return
        }

        if (deltaY > SCROLL_THRESHOLD) {
          nextPage()
        } else if (deltaY < -SCROLL_THRESHOLD) {
          prevPage()
        }
      } else {
        if (isHorizontallyScrollable && !((deltaX > 0 && atRight) || (deltaX < 0 && atLeft))) {
          return
        }

        if (deltaX > SCROLL_THRESHOLD) {
          nextPage()
        } else if (deltaX < -SCROLL_THRESHOLD) {
          prevPage()
        }
      }
    }
    window.addEventListener('wheel', handleWheel, { passive: true })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [nextPage, prevPage])

  // NOTE: 이미지 스크롤 가능할 때 페이지 변경 시 스크롤 위치를 자연스럽게 설정함
  useEffect(() => {
    const ul = ulRef.current
    if (!ul) return

    const isVerticallyScrollable = ul.scrollHeight > ul.clientHeight
    const isHorizontallyScrollable = ul.scrollWidth > ul.clientWidth
    if (!isVerticallyScrollable && !isHorizontallyScrollable) return

    const isNavigatingBackward = currentIndex < previousIndexRef.current
    const touchOrientation = getTouchOrientation()
    previousIndexRef.current = currentIndex

    if (isNavigatingBackward) {
      if (touchOrientation === 'vertical') {
        ul.scrollTo({ top: ul.scrollHeight - ul.clientHeight, left: 0, behavior: 'instant' })
      } else {
        ul.scrollTo({ top: 0, left: ul.scrollWidth - ul.clientWidth, behavior: 'instant' })
      }
    } else {
      ul.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    }
  }, [currentIndex, getTouchOrientation])

  // NOTE: 페이지 전환 시 스크롤 관성을 방지함
  useEffect(() => {
    const ul = ulRef.current
    if (!ul) return

    ul.style.overflow = 'hidden'

    setTimeout(() => {
      ul.style.overflow = 'auto'
    }, 500)
  }, [currentIndex])

  return (
    <ul
      className={`h-dvh select-none overscroll-none [&_li]:flex [&_li]:aria-hidden:sr-only [&_img]:pb-safe [&_img]:border [&_img]:border-background ${screenFitStyle[screenFit]}`}
      onClick={handleClick}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      ref={ulRef}
    >
      {Array.from({ length: IMAGE_PREFETCH_AMOUNT }).map((_, offset) => (
        <TouchViewerItem key={offset} manga={manga} offset={offset} pageView={pageView} />
      ))}
    </ul>
  )
}

function TouchViewerItem({ offset, manga, pageView }: TouchViewerItemProps) {
  const currentIndex = useImageIndexStore((state) => state.imageIndex)
  const imageIndex = currentIndex + offset
  const brightness = useBrightnessStore((state) => state.brightness)

  return (
    <li aria-hidden={offset !== 0} style={{ filter: `brightness(${brightness}%)` }}>
      <MangaImage
        fetchPriority={offset < IMAGE_FETCH_PRIORITY_THRESHOLD ? 'high' : 'low'}
        imageIndex={imageIndex}
        manga={manga}
      />
      {pageView === 'double' && offset === 0 && (
        <MangaImage
          fetchPriority={offset < IMAGE_FETCH_PRIORITY_THRESHOLD ? 'high' : 'low'}
          imageIndex={imageIndex + 1}
          manga={manga}
        />
      )}
    </li>
  )
}
