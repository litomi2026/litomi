'use client'

import { PageView } from '@/components/ImageViewer/store/pageView'
import { ScreenFit } from '@/components/ImageViewer/store/screenFit'
import { useTouchOrientationStore } from '@/components/ImageViewer/store/touchOrientation'
import useImageNavigation from '@/hook/useImageNavigation'
import { Manga } from '@/types/manga'
import { memo, useCallback, useRef } from 'react'

import MangaImage from '../MangaImage'
import { useBrightnessStore } from './store/brightness'
import { useImageIndexStore } from './store/imageIndex'

const HORIZONTAL_SWIPE_THRESHOLD = 50 // 가로 스와이프 감지 임계값 (px)
const VERTICAL_SWIPE_THRESHOLD = 25 // 세로 스와이프 감지 임계값 (px)
const EDGE_CLICK_THRESHOLD = 1 / 3 // 화면 3등분 시의 경계값

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
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const initialBrightnessRef = useRef(100)
  const swipeDetectedRef = useRef(false)
  const frameId = useRef<number | null>(null)
  const pendingBrightness = useRef(getBrightness())

  // 밝기 업데이트 함수: requestAnimationFrame을 통해 한 프레임에 한 번만 업데이트
  const updateBrightness = useCallback(
    (newBrightness: number) => {
      pendingBrightness.current = newBrightness
      if (frameId.current === null) {
        frameId.current = requestAnimationFrame(() => {
          setBrightness(pendingBrightness.current)
          frameId.current = null
        })
      }
    },
    [setBrightness],
  )

  const { prevPage, nextPage } = useImageNavigation({
    maxIndex: images.length - 1,
    offset: pageView === 'double' ? 2 : 1,
  })

  // 포인터 시작 시 좌표와 현재 밝기 기록
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      pointerStartRef.current = { x: e.clientX, y: e.clientY }
      initialBrightnessRef.current = getBrightness()
      swipeDetectedRef.current = false
    },
    [getBrightness],
  )

  // 포인터 이동 시: 세로 스와이프 감지 시 밝기 업데이트 (throttled)
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      // 가로 맞춤일 땐 세로 스크롤이 발생할 수 있기 때문에 세로 스와이프 방지
      if (screenFit === 'width') return
      if (!pointerStartRef.current) return

      const diffX = e.clientX - pointerStartRef.current.x
      const diffY = e.clientY - pointerStartRef.current.y
      const isVerticalSwipe = Math.abs(diffY) > VERTICAL_SWIPE_THRESHOLD && Math.abs(diffY) > Math.abs(diffX)

      if (!isVerticalSwipe) return

      // 세로 스와이프일 때 위로 스와이프(diffY 음수) 시 밝기 증가, 아래로 스와이프 시 밝기 감소
      swipeDetectedRef.current = true
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const deltaBrightness = (diffY / (rect.height / 2)) * 90
      const newBrightness = initialBrightnessRef.current - deltaBrightness

      if (newBrightness < 10 || newBrightness > 100) return

      updateBrightness(newBrightness)
    },
    [screenFit, updateBrightness],
  )

  // 포인터 종료 시: 가로 스와이프와 세로 스와이프 구분
  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      // 세로 맞춤일 땐 가로 스크롤이 발생할 수 있기 때문에 가로 스와이프 방지
      if (screenFit === 'height') return
      if (!pointerStartRef.current) return

      const diffX = e.clientX - pointerStartRef.current.x
      const diffY = e.clientY - pointerStartRef.current.y
      const isVerticalSwipe = Math.abs(diffY) > VERTICAL_SWIPE_THRESHOLD && Math.abs(diffY) > Math.abs(diffX)

      // 세로 스와이프가 감지되었으면 페이지 전환 없이 종료
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
    [nextPage, prevPage, screenFit],
  )

  // 클릭 이벤트: 스와이프가 발생하지 않았을 때 화면 터치 처리
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

  return (
    <ul
      className={`h-dvh select-none overscroll-none [&_li]:flex [&_li]:aria-hidden:sr-only [&_img]:pb-safe [&_img]:border [&_img]:border-background ${screenFitStyle[screenFit]}`}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {Array.from({ length: 10 }).map((_, offset) => (
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
    <li aria-hidden={offset !== 0} key={offset} style={{ filter: `brightness(${brightness}%)` }}>
      <MangaImage imageIndex={imageIndex} manga={manga} />
      {pageView === 'double' && offset === 0 && <MangaImage imageIndex={imageIndex + 1} manga={manga} />}
    </li>
  )
}
