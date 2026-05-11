'use client'

import { Loader2 } from 'lucide-react'

import MangaImage from '@/components/MangaImage'
import { TOUCH_VIEWER_IMAGE_PREFETCH_AMOUNT } from '@/constants/policy'
import { ImageWithVariants, Manga } from '@/types/manga'

import LastPage from '../LastPage'
import { useBrightnessStore } from '../store/brightness'
import { useOrientationStore } from '../store/orientation'
import { usePageNavigationStore } from '../store/pageNavigation'
import { usePageViewStore } from '../store/pageView'
import { useReadingDirectionStore } from '../store/readingDirection'
import { ScreenFit, useScreenFitStore } from '../store/screenFit'
import useInitialViewerPage from '../useInitialViewerPage'
import { getResponsivePictureSources } from '../util'
import { NATIVE_GESTURE_BLOCK_CSS } from '../viewerGesturePolicy'
import usePageNavigation from './usePageNavigation'
import usePageViewerScrollRestoration from './usePageViewerScrollRestoration'
import usePageViewerWheelNavigation from './usePageViewerWheelNavigation'
import usePageViewerZoom from './usePageViewerZoom'
import useViewerPointerGestures from './useViewerPointerGestures'

const IMAGE_FETCH_PRIORITY_THRESHOLD = 2

const screenFitContentStyle: Record<ScreenFit, string> = {
  width:
    'flex justify-center items-center [&_li]:w-fit [&_li]:max-w-full [&_li]:h-full [&_picture]:contents [&_img]:my-auto [&_img]:min-w-0 [&_img]:max-w-fit [&_img]:h-auto',
  height:
    '[&_li]:items-center [&_li]:mx-auto [&_li]:w-fit [&_li]:h-full [&_picture]:contents [&_img]:max-w-fit [&_img]:h-auto [&_img]:max-h-dvh',
  all: 'p-safe [&_li]:items-center [&_li]:mx-auto [&_picture]:contents [&_img]:min-w-0 [&_li]:w-fit [&_li]:h-full [&_img]:max-h-dvh',
}

type PageViewerItemProps = {
  isLowDataMode: boolean
  manga: {
    id: number
    title: string
    images?: ImageWithVariants[]
  }
  offset: number
}

type Props = {
  isLowDataMode: boolean
  manga: Manga
  onClick: () => void
  showController: boolean
}

type TouchAreaOverlayProps = {
  showController: boolean
}

export default function PageViewer({ isLowDataMode, manga, onClick, showController }: Props) {
  const { images = [] } = manga
  const imageCount = images.length
  const isDoublePage = usePageViewStore((state) => state.pageView === 'double')
  const screenFit = useScreenFitStore((state) => state.screenFit)

  const pageViewerOffsets = isLowDataMode
    ? [0, 1]
    : Array.from({ length: TOUCH_VIEWER_IMAGE_PREFETCH_AMOUNT }, (_, i) => i - 1)

  const { prevPage, nextPage } = usePageNavigation({
    maxIndex: images.length,
    offset: isDoublePage ? 2 : 1,
  })

  const {
    captureZoomAnchorAtClientPoint,
    contentRef,
    isDefaultZoom,
    measureZoomLayout,
    scrollRef,
    styles,
    zoomToAnchor,
  } = usePageViewerZoom({ imageCount })

  const { handlePointerCancel, handlePointerDown, handlePointerMove, handlePointerUp } = useViewerPointerGestures({
    captureZoomAnchorAtClientPoint,
    nextPage,
    onCenterTap: onClick,
    prevPage,
    zoomToAnchor,
  })

  useInitialViewerPage({ maxIndex: imageCount })
  usePageViewerScrollRestoration({ scrollRef })
  usePageViewerWheelNavigation({ nextPage, prevPage, scrollRef })

  return (
    <>
      {isDefaultZoom && <TouchAreaOverlay showController={showController} />}
      <div
        className={`h-dvh overflow-auto overscroll-none touch-none ${NATIVE_GESTURE_BLOCK_CSS}`}
        onDragStart={(e) => e.preventDefault()}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={scrollRef}
      >
        <div className="relative min-h-full min-w-full" style={styles.zoomScrollArea}>
          <ul
            className={`absolute left-0 top-0 h-dvh [&_li]:flex [&_li]:aria-hidden:sr-only [&_img]:border [&_img]:border-background ${screenFitContentStyle[screenFit]}`}
            onLoadCapture={measureZoomLayout}
            ref={contentRef}
            style={styles.zoomContent}
          >
            {imageCount === 0 ? (
              <li className="flex items-center justify-center h-full animate-fade-in">
                <output className="flex items-center justify-center">
                  <Loader2 aria-hidden="true" className="size-8 animate-spin" />
                  <span className="sr-only">이미지 불러오는 중</span>
                </output>
              </li>
            ) : (
              pageViewerOffsets.map((offset) => (
                <PageViewerItem isLowDataMode={isLowDataMode} key={offset} manga={manga} offset={offset} />
              ))
            )}
          </ul>
        </div>
      </div>
    </>
  )
}

function PageViewerItem({ isLowDataMode, offset, manga }: PageViewerItemProps) {
  const { images = [] } = manga
  const currentPageIndex = usePageNavigationStore((state) => state.pageIndex)
  const brightness = useBrightnessStore((state) => state.brightness)
  const isDoublePage = usePageViewStore((state) => state.pageView === 'double')
  const pageIndex = (isDoublePage ? Math.floor(currentPageIndex / 2) * 2 : currentPageIndex) + offset
  const isDoublePageSpread = isDoublePage && offset === 0
  const isRTL = useReadingDirectionStore((state) => state.readingDirection === 'rtl')

  if (pageIndex < 0 || pageIndex > images.length) {
    return null
  }

  const fetchPriority = isLowDataMode
    ? offset === 0
      ? 'high'
      : 'low'
    : offset < IMAGE_FETCH_PRIORITY_THRESHOLD
      ? 'high'
      : 'low'

  function renderPage(pageIndex: number) {
    if (pageIndex < 0 || pageIndex > images.length) {
      return null
    }

    if (pageIndex === images.length) {
      return <LastPage manga={manga} />
    }

    const image = images[pageIndex]

    return (
      <MangaImage
        alt={`${manga.title} ${pageIndex + 1}페이지`}
        fetchPriority={fetchPriority}
        imageIndex={pageIndex}
        mangaId={manga.id}
        pictures={getResponsivePictureSources(image)}
        src={image?.thumbnail?.url}
        variant="thumbnail"
      />
    )
  }

  const first = renderPage(pageIndex)
  const second = isDoublePageSpread ? renderPage(pageIndex + 1) : null

  return (
    <li aria-hidden={offset !== 0} style={{ filter: `brightness(${brightness}%)` }}>
      {isRTL ? (
        <>
          {second}
          {first}
        </>
      ) : (
        <>
          {first}
          {second}
        </>
      )}
    </li>
  )
}

function TouchAreaOverlay({ showController }: TouchAreaOverlayProps) {
  const orientation = useOrientationStore((state) => state.orientation)
  const isHorizontal = orientation === 'horizontal' || orientation === 'horizontal-reverse'
  const isReversed = orientation === 'horizontal-reverse' || orientation === 'vertical-reverse'

  return (
    <div
      aria-hidden="true"
      aria-orientation={isHorizontal ? 'horizontal' : 'vertical'}
      className="fixed inset-0 z-10 pointer-events-none flex select-none transition text-foreground text-xs font-medium opacity-0 data-[visible=true]:opacity-100 aria-[orientation=vertical]:flex-col"
      data-visible={showController ? 'true' : 'false'}
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
