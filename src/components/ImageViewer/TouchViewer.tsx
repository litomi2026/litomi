'use client'

import { getImageSrc } from '@/constants/url'
import { usePageViewStore } from '@/store/controller/pageView'
import { useScreenFitStore } from '@/store/controller/screenFit'
import { useTouchOrientationStore } from '@/store/controller/touchOrientation'
import { Manga } from '@/types/manga'
import { useRef } from 'react'

const SWIPE_THRESHOLD = 50 // 스와이프 감지 임계값 (px)
const EDGE_CLICK_THRESHOLD = 1 / 3

type Props = {
  manga: Manga
  currentIndex: number
  onNavigate: (direction: 'next' | 'prev') => void
  onClick: () => void
}

export default function TouchViewer({ manga, currentIndex, onNavigate, onClick }: Props) {
  const { images, cdn, id } = manga
  const pageView = usePageViewStore((state) => state.pageView)
  const screenFit = useScreenFitStore((state) => state.screenFit)
  const touchOrientation = useTouchOrientationStore((state) => state.touchOrientation)
  const pointerStartRef = useRef<null | { x: number; y: number }>(null)

  const screenFitStyle = {
    width: `overflow-y-auto overscroll-none [&_li]:mx-auto [&_li]:w-fit [&_li]:max-w-full [&_li]:first:h-full [&_img]:my-auto [&_img]:min-w-0 [&_img]:max-w-fit [&_img]:h-auto`,
    height:
      'overflow-x-auto overscroll-none [&_li]:items-center [&_li]:mx-auto [&_li]:w-fit [&_li]:first:h-full [&_img]:max-w-fit [&_img]:h-auto [&_img]:max-h-dvh',
    all: '[&_li]:items-center [&_li]:mx-auto [&_img]:min-w-0 [&_li]:w-fit [&_li]:h-full [&_img]:max-h-dvh',
  }[screenFit]

  // 포인터 시작 시 좌표 기록
  const handlePointerDown = (e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
  }

  // 포인터 종료 시, touchOrientation에 따라 스와이프 방향 결정
  const handlePointerUp = (e: React.PointerEvent) => {
    if (!pointerStartRef.current) return

    const diffX = e.clientX - pointerStartRef.current.x
    const diffY = e.clientY - pointerStartRef.current.y

    if (touchOrientation === 'horizontal') {
      if (Math.abs(diffX) > SWIPE_THRESHOLD) {
        if (diffX > 0) {
          onNavigate('prev') // 오른쪽 스와이프
        } else {
          onNavigate('next') // 왼쪽 스와이프
        }
      }
    } else if (touchOrientation === 'vertical') {
      if (Math.abs(diffY) > SWIPE_THRESHOLD) {
        if (diffY > 0) {
          onNavigate('prev') // 아래쪽 스와이프
        } else {
          onNavigate('next') // 위쪽 스와이프
        }
      }
    }

    pointerStartRef.current = null
  }

  // 클릭 이벤트: 화면을 3등분하여 영역에 따라 이동/클릭 처리
  const handleClick = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()

    if (touchOrientation === 'horizontal') {
      const clickX = e.clientX - rect.left
      if (clickX < rect.width * EDGE_CLICK_THRESHOLD) {
        onNavigate('prev')
      } else if (clickX > rect.width * (1 - EDGE_CLICK_THRESHOLD)) {
        onNavigate('next')
      } else {
        onClick()
      }
    } else if (touchOrientation === 'vertical') {
      const clickY = e.clientY - rect.top
      if (clickY < rect.height * EDGE_CLICK_THRESHOLD) {
        onNavigate('prev')
      } else if (clickY > rect.height * (1 - EDGE_CLICK_THRESHOLD)) {
        onNavigate('next')
      } else {
        onClick()
      }
    }
  }

  return (
    <ul
      className={`h-dvh select-none [&_li]:flex [&_img]:border [&_img]:border-gray-800 [&_img]:aria-hidden:sr-only ${screenFitStyle}`}
      onClick={handleClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      {Array.from({ length: 10 }).map((_, offset) => {
        const imageIndex = currentIndex + offset
        const nextImageIndex = imageIndex + 1
        const image = images[imageIndex]
        const nextImage = images[nextImageIndex]

        return (
          <li key={offset}>
            {image && (
              <img
                alt={`manga-image-${imageIndex + 1}`}
                aria-hidden={offset !== 0}
                draggable={false}
                fetchPriority={imageIndex < 5 ? 'high' : 'low'}
                referrerPolicy="same-origin"
                src={getImageSrc({ cdn, id, name: image.name })}
              />
            )}
            {pageView === 'double' && offset === 0 && nextImage && (
              <img
                alt={`manga-image-${nextImageIndex + 1}`}
                draggable={false}
                fetchPriority={nextImageIndex < 5 ? 'high' : 'low'}
                referrerPolicy="same-origin"
                src={getImageSrc({ cdn, id, name: nextImage.name })}
              />
            )}
          </li>
        )
      })}
    </ul>
  )
}
