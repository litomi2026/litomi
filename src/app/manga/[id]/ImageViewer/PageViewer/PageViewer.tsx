'use client'

import { Loader2 } from 'lucide-react'

import MangaImage from '@/components/MangaImage'
import { TOUCH_VIEWER_IMAGE_PREFETCH_AMOUNT } from '@/constants/policy'
import { ImageWithVariants, Manga } from '@/types/manga'

import LastPageActions from '../LastPageActions'
import RatingInput from '../RatingInput'
import { useBrightnessStore } from '../store/brightness'
import { useImageIndexStore } from '../store/imageIndex'
import { useOrientationStore } from '../store/orientation'
import { usePageViewStore } from '../store/pageView'
import { useReadingDirectionStore } from '../store/readingDirection'
import { ScreenFit, useScreenFitStore } from '../store/screenFit'
import { DEFAULT_ZOOM } from '../store/zoom'
import { getResponsivePictureSources } from '../util'
import useImageNavigation from './useImageNavigation'
import usePageViewerInitialPage from './usePageViewerInitialPage'
import usePageViewerPointerGestures from './usePageViewerPointerGestures'
import usePageViewerScrollRestoration from './usePageViewerScrollRestoration'
import usePageViewerWheel from './usePageViewerWheel'
import usePageViewerZoom from './usePageViewerZoom'

const IMAGE_FETCH_PRIORITY_THRESHOLD = 2

const screenFitViewportStyle: Record<ScreenFit, string> = {
  width: 'touch-pan-y',
  height: 'touch-pan-x',
  all: '',
}

const screenFitContentStyle: Record<ScreenFit, string> = {
  width:
    'flex justify-center items-center [&_li]:w-fit [&_li]:max-w-full [&_li]:h-full [&_picture]:contents [&_img]:my-auto [&_img]:min-w-0 [&_img]:max-w-fit [&_img]:h-auto',
  height:
    '[&_li]:items-center [&_li]:mx-auto [&_li]:w-fit [&_li]:h-full [&_picture]:contents [&_img]:max-w-fit [&_img]:h-auto [&_img]:max-h-dvh',
  all: 'p-safe [&_li]:items-center [&_li]:mx-auto [&_picture]:contents [&_img]:min-w-0 [&_li]:w-fit [&_li]:h-full [&_img]:max-h-dvh',
}

type LastPageProps = {
  manga: {
    id: number
    title: string
  }
  isHidden?: boolean
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

  const { prevPage, nextPage } = useImageNavigation({
    maxIndex: images.length,
    offset: isDoublePage ? 2 : 1,
  })

  const {
    captureZoomAnchorAtClientPoint,
    contentRef,
    handleCursorZoomWheel,
    measureZoomLayout,
    scrollRef,
    zoomToAnchor,
    zoomContentStyle,
    zoomLevel,
    zoomScrollAreaStyle,
  } = usePageViewerZoom({ imageCount })

  const { handleClick, handlePointerCancel, handlePointerDown, handlePointerMove, handlePointerUp } =
    usePageViewerPointerGestures({
      captureZoomAnchorAtClientPoint,
      nextPage,
      onClick,
      prevPage,
      zoomToAnchor,
    })

  usePageViewerInitialPage({ imageCount })
  usePageViewerScrollRestoration({ scrollRef })
  usePageViewerWheel({ handleCursorZoomWheel, nextPage, prevPage, scrollRef })

  return (
    <>
      {zoomLevel === DEFAULT_ZOOM && <TouchAreaOverlay showController={showController} />}
      <div
        className={`h-dvh overflow-auto select-none overscroll-none touch-pinch-zoom ${screenFitViewportStyle[screenFit]}`}
        onClick={handleClick}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        ref={scrollRef}
      >
        <div className="relative min-h-full min-w-full" style={zoomScrollAreaStyle}>
          <ul
            className={`absolute left-0 top-0 h-dvh [&_li]:flex [&_li]:aria-hidden:sr-only [&_img]:border [&_img]:border-background ${screenFitContentStyle[screenFit]}`}
            onLoadCapture={measureZoomLayout}
            ref={contentRef}
            style={zoomContentStyle}
          >
            {imageCount === 0 ? (
              <li className="flex items-center justify-center h-full animate-fade-in">
                <Loader2 className="size-8 animate-spin" />
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

function LastPage({ manga, isHidden = false }: LastPageProps) {
  const { id } = manga

  return (
    <li aria-hidden={isHidden} className="flex flex-col items-center justify-center gap-4 p-4 aria-hidden:hidden">
      <RatingInput className="select-text" mangaId={id} />
      <LastPageActions manga={manga} />
    </li>
  )
}

function PageViewerItem({ isLowDataMode, offset, manga }: PageViewerItemProps) {
  const { images = [] } = manga
  const currentIndex = useImageIndexStore((state) => state.imageIndex)
  const imageIndex = currentIndex + offset
  const brightness = useBrightnessStore((state) => state.brightness)
  const isDoublePage = usePageViewStore((state) => state.pageView === 'double') && offset === 0
  const isRTL = useReadingDirectionStore((state) => state.readingDirection === 'rtl')

  if (imageIndex < 0 || imageIndex >= images.length + 1) {
    return null
  }

  if (imageIndex === images.length) {
    return <LastPage isHidden={offset !== 0} manga={manga} />
  }

  const nextImageIndex = imageIndex + 1
  const firstImage = images[imageIndex]
  const secondImage = images[nextImageIndex]

  const fetchPriority = isLowDataMode
    ? offset === 0
      ? 'high'
      : 'low'
    : offset < IMAGE_FETCH_PRIORITY_THRESHOLD
      ? 'high'
      : 'low'

  const first = imageIndex >= 0 && (
    <MangaImage
      fetchPriority={fetchPriority}
      imageIndex={imageIndex}
      mangaId={manga.id}
      pictures={getResponsivePictureSources(firstImage)}
      src={firstImage?.thumbnail?.url}
      variant="thumbnail"
    />
  )

  const second = isDoublePage && nextImageIndex < images.length && (
    <MangaImage
      fetchPriority={fetchPriority}
      imageIndex={nextImageIndex}
      mangaId={manga.id}
      pictures={getResponsivePictureSources(secondImage)}
      src={secondImage?.thumbnail?.url}
      variant="thumbnail"
    />
  )

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
