'use client'

import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useRef } from 'react'

import BookmarkButton from '@/components/card/BookmarkButton'
import IconSpinner from '@/components/icons/IconSpinner'
import MangaImage from '@/components/MangaImage'
import { TOUCH_VIEWER_IMAGE_PREFETCH_AMOUNT } from '@/constants/policy'
import { ImageWithVariants, Manga } from '@/types/manga'

import { MangaIdSearchParam } from '../common'
import RatingInput from './RatingInput'
import { useBrightnessStore } from './store/brightness'
import { useImageIndexStore } from './store/imageIndex'
import { PageView } from './store/pageView'
import { ReadingDirection } from './store/readingDirection'
import { ScreenFit } from './store/screenFit'
import { useTouchOrientationStore } from './store/touchOrientation'
import { DEFAULT_ZOOM, useZoomStore } from './store/zoom'
import useImageNavigation from './useImageNavigation'

const HORIZONTAL_SWIPE_THRESHOLD = 50 // 가로 스와이프 임계값 (px)
const VERTICAL_SWIPE_THRESHOLD = 10 // 세로 스와이프 임계값 (px)
const EDGE_CLICK_THRESHOLD = 1 / 3 // 화면 3등분 시의 경계값
const IMAGE_FETCH_PRIORITY_THRESHOLD = 2
const SCROLL_THRESHOLD = 1
const SCROLL_THROTTLE = 500
const SCREEN_EDGE_THRESHOLD = 40 // 브라우저 제스처 감지를 위한 화면 가장자리 임계값 (px)
const ZOOM_SPEED = 0.002

const screenFitStyle = {
  width:
    'flex justify-center items-center touch-pan-y overflow-y-auto [&_li]:w-fit [&_li]:max-w-full [&_li]:h-full [&_img]:my-auto [&_img]:min-w-0 [&_img]:max-w-fit [&_img]:h-auto',
  height:
    'touch-pan-x overflow-x-auto [&_li]:items-center [&_li]:mx-auto [&_li]:w-fit [&_li]:h-full [&_img]:max-w-fit [&_img]:h-auto [&_img]:max-h-dvh',
  all: '[&_li]:items-center [&_li]:mx-auto [&_img]:min-w-0 [&_li]:w-fit [&_li]:h-full [&_img]:max-h-dvh',
}

type LastPageProps = {
  manga: {
    id: number
  }
  isHidden?: boolean
}

type Props = {
  manga: Manga
  onClick: () => void
  pageView: PageView
  screenFit: ScreenFit
  readingDirection: ReadingDirection
  showController: boolean
}

type TouchAreaOverlayProps = {
  showController: boolean
}

type TouchViewerItemProps = {
  manga: {
    id: number
    images?: ImageWithVariants[]
  }
  offset: number
  pageView: PageView
  readingDirection: ReadingDirection
}

export default function TouchViewer({ manga, onClick, screenFit, pageView, readingDirection, showController }: Props) {
  const { images = [] } = manga
  const getTouchOrientation = useTouchOrientationStore((state) => state.getTouchOrientation)
  const getBrightness = useBrightnessStore((state) => state.getBrightness)
  const setBrightness = useBrightnessStore((state) => state.setBrightness)
  const setImageIndex = useImageIndexStore((state) => state.setImageIndex)
  const currentIndex = useImageIndexStore((state) => state.imageIndex)
  const zoomLevel = useZoomStore((state) => state.zoomLevel)
  const getZoomLevel = useZoomStore((state) => state.getZoomLevel)
  const setZoomLevel = useZoomStore((state) => state.setZoomLevel)
  const resetZoom = useZoomStore((state) => state.resetZoom)
  const pointerStartRef = useRef<{ x: number; y: number } | null>(null)
  const initialBrightnessRef = useRef(100)
  const swipeDetectedRef = useRef(false)
  const activePointers = useRef(new Set<number>())
  const ulRef = useRef<HTMLUListElement>(null)
  const throttleRef = useRef(false)
  const previousIndexRef = useRef(currentIndex)
  const pinchZoomedRef = useRef(false)

  const { prevPage, nextPage } = useImageNavigation({
    maxIndex: images.length,
    offset: pageView === 'double' ? 2 : 1,
  })

  // 포인터 시작 시 좌표, 현재 밝기 기록 및 포인터 ID 등록
  function handlePointerDown(e: React.PointerEvent) {
    const isEdgeSwipe = e.clientX < SCREEN_EDGE_THRESHOLD || e.clientX > window.innerWidth - SCREEN_EDGE_THRESHOLD
    if (isEdgeSwipe) return

    initialBrightnessRef.current = getBrightness()
    swipeDetectedRef.current = false
    activePointers.current.add(e.pointerId)
    pointerStartRef.current = { x: e.clientX, y: e.clientY }
  }

  // 포인터 이동 시: 세로 스와이프 감지 시 밝기 업데이트, 핀치 줌(멀티 터치) 중이면 밝기 조절 방지
  function handlePointerMove(e: React.PointerEvent) {
    if (!pointerStartRef.current) return

    const isPinching = activePointers.current.size > 1
    if (isPinching) return

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
  }

  // 포인터 종료 시: 포인터 ID 제거 및 스와이프/페이지 전환 처리
  function handlePointerUp(e: React.PointerEvent) {
    activePointers.current.delete(e.pointerId)

    const isHorizontalScrollable = ulRef.current && ulRef.current.scrollHeight < ulRef.current.clientHeight
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
      const touchOrientation = getTouchOrientation()
      const isReversed = touchOrientation === 'horizontal-reverse' || touchOrientation === 'vertical-reverse'

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

  // 포인터 캔슬 시 포인터 ID 제거
  function handlePointerCancel(e: React.PointerEvent) {
    activePointers.current.delete(e.pointerId)
  }

  // 클릭 이벤트: 스와이프 미발생 시 처리
  function handleClick(e: React.MouseEvent) {
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
    } else if (touchOrientation === 'horizontal-reverse') {
      const clickX = e.clientX - rect.left
      if (clickX < rect.width * EDGE_CLICK_THRESHOLD) {
        nextPage()
      } else if (clickX > rect.width * (1 - EDGE_CLICK_THRESHOLD)) {
        prevPage()
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
    } else if (touchOrientation === 'vertical-reverse') {
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
      } else if (touchOrientation === 'vertical-reverse') {
        ul.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      } else if (touchOrientation === 'horizontal-reverse') {
        ul.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      } else {
        ul.scrollTo({ top: 0, left: ul.scrollWidth - ul.clientWidth, behavior: 'instant' })
      }
    } else {
      if (touchOrientation === 'vertical-reverse') {
        ul.scrollTo({ top: ul.scrollHeight - ul.clientHeight, left: 0, behavior: 'instant' })
      } else if (touchOrientation === 'horizontal-reverse') {
        ul.scrollTo({ top: 0, left: ul.scrollWidth - ul.clientWidth, behavior: 'instant' })
      } else {
        ul.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      }
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

  // NOTE: page 파라미터가 있으면 초기 페이지를 변경함
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const pageStr = params.get(MangaIdSearchParam.PAGE) ?? ''
    const parsedPage = parseInt(pageStr, 10)

    if (isNaN(parsedPage)) {
      return
    }

    setImageIndex(Math.max(0, Math.min(parsedPage - 1, images.length)))
  }, [images.length, setImageIndex])

  // NOTE: 마우스 휠 또는 터치패드 스와이프 시 페이지를 전환함
  useEffect(() => {
    function handleWheel({ deltaX, deltaY, ctrlKey, metaKey }: WheelEvent) {
      if (ctrlKey || metaKey || throttleRef.current) {
        return
      }

      if (getZoomLevel() > DEFAULT_ZOOM || pinchZoomedRef.current) {
        return
      }

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
  }, [nextPage, prevPage, getZoomLevel])

  // NOTE: metakey + scroll 시 이미지 확대/축소함
  useEffect(() => {
    function handleWheel(event: WheelEvent) {
      const { deltaY, metaKey } = event
      const ul = ulRef.current

      if (!metaKey || !ul) {
        return
      }

      event.preventDefault()
      const currentZoom = getZoomLevel()
      const zoomDelta = -deltaY * ZOOM_SPEED
      setZoomLevel(currentZoom * (1 + zoomDelta))
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [setZoomLevel, getZoomLevel])

  // NOTE: ctrl/cmd + 0 키로 줌 리셋
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === '0') {
        resetZoom()

        const ul = ulRef.current
        if (ul) {
          ul.scrollLeft = 0
          ul.scrollTop = 0
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [resetZoom])

  return (
    <>
      {!pinchZoomedRef.current && zoomLevel === DEFAULT_ZOOM && <TouchAreaOverlay showController={showController} />}
      <ul
        className={`h-dvh touch-pinch-zoom origin-top-left select-none overscroll-none [&_li]:flex [&_li]:aria-hidden:sr-only [&_img]:pb-safe [&_img]:border [&_img]:border-background ${screenFitStyle[screenFit]}`}
        onClick={handleClick}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={ulRef}
        style={{ transform: `scale(${zoomLevel.toFixed(2)})` }}
      >
        {images.length === 0 ? (
          <li className="flex items-center justify-center h-full animate-fade-in">
            <IconSpinner className="size-8" />
          </li>
        ) : (
          Array.from({ length: TOUCH_VIEWER_IMAGE_PREFETCH_AMOUNT }).map((_, offset) => (
            <TouchViewerItem
              key={offset}
              manga={manga}
              offset={offset - 1}
              pageView={pageView}
              readingDirection={readingDirection}
            />
          ))
        )}
      </ul>
    </>
  )
}

function LastPage({ manga, isHidden = false }: LastPageProps) {
  const { id } = manga

  return (
    <li aria-hidden={isHidden} className="flex flex-col items-center justify-center gap-4 p-4 aria-hidden:hidden">
      <RatingInput className="select-text" mangaId={id} />
      <div className="grid grid-cols-2 items-center gap-2 text-sm font-medium text-foreground">
        <Link
          className="flex items-center gap-2 p-4 py-2 border border-foreground/20 rounded-lg hover:bg-foreground/10 transition"
          href={`/manga/${id}/detail`}
          onClick={(e) => e.stopPropagation()}
        >
          <MessageCircle className="size-4" />
          작품 후기
        </Link>
        <BookmarkButton
          className="p-4 w-full py-2 border border-foreground/20 rounded-lg hover:bg-foreground/10 transition"
          manga={manga}
        />
      </div>
    </li>
  )
}

function TouchAreaOverlay({ showController }: TouchAreaOverlayProps) {
  const touchOrientation = useTouchOrientationStore((state) => state.touchOrientation)
  const isHorizontal = touchOrientation === 'horizontal' || touchOrientation === 'horizontal-reverse'
  const isReversed = touchOrientation === 'horizontal-reverse' || touchOrientation === 'vertical-reverse'

  return (
    <div
      aria-hidden={!showController}
      aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
      className="fixed inset-0 z-10 pointer-events-none flex transition text-foreground text-xs font-medium aria-hidden:opacity-0 aria-[orientation=vertical]:flex-col"
    >
      <div className="flex-1 flex items-center justify-center">
        <span className="px-4 py-2 rounded-full bg-background/80 border border-foreground/40">
          {isReversed ? '다음' : '이전'}
        </span>
      </div>
      {isHorizontal && <div className="flex-1" />}
      <div className="flex-1 flex items-center justify-center">
        <span className="px-4 py-2 rounded-full bg-background/80 border border-foreground/40">
          {isReversed ? '이전' : '다음'}
        </span>
      </div>
    </div>
  )
}

function TouchViewerItem({ offset, manga, pageView, readingDirection }: TouchViewerItemProps) {
  const { images = [] } = manga
  const currentIndex = useImageIndexStore((state) => state.imageIndex)
  const imageIndex = currentIndex + offset
  const brightness = useBrightnessStore((state) => state.brightness)

  if (imageIndex < 0 || imageIndex >= images.length + 1) {
    return null
  }

  if (imageIndex === images.length) {
    return <LastPage isHidden={offset !== 0} manga={manga} />
  }

  const isRTL = readingDirection === 'rtl'
  const isDoublePage = pageView === 'double' && offset === 0
  const nextImageIndex = imageIndex + 1

  const firstImage = imageIndex >= 0 && (
    <MangaImage
      fetchPriority={offset < IMAGE_FETCH_PRIORITY_THRESHOLD ? 'high' : 'low'}
      imageIndex={imageIndex}
      src={images[imageIndex]?.original?.url}
    />
  )

  const secondImage = isDoublePage && nextImageIndex < images.length && (
    <MangaImage
      fetchPriority={offset < IMAGE_FETCH_PRIORITY_THRESHOLD ? 'high' : 'low'}
      imageIndex={nextImageIndex}
      src={images[nextImageIndex]?.original?.url}
    />
  )

  return (
    <li aria-hidden={offset !== 0} style={{ filter: `brightness(${brightness}%)` }}>
      {isRTL ? (
        <>
          {secondImage}
          {firstImage}
        </>
      ) : (
        <>
          {firstImage}
          {secondImage}
        </>
      )}
    </li>
  )
}
