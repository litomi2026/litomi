import { Loader2 } from 'lucide-react'
import { CSSProperties, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { List, RowComponentProps, useDynamicRowHeight, useListRef } from 'react-window'

import MangaImage from '@/components/MangaImage'
import { Manga } from '@/types/manga'

import LastPage from '../LastPage'
import { useBrightnessStore } from '../store/brightness'
import { useImageWidthStore } from '../store/imageWidth'
import { usePageNavigationStore } from '../store/pageNavigation'
import { usePageViewStore } from '../store/pageView'
import { useReadingDirectionStore } from '../store/readingDirection'
import { ScreenFit, useScreenFitStore } from '../store/screenFit'
import { useVirtualScrollStore } from '../store/virtualizer'
import { useZoomStore } from '../store/zoom'
import useInitialViewerPage from '../useInitialViewerPage'
import { getResponsivePictureSources } from '../util'
import { NATIVE_GESTURE_BLOCK_CSS } from '../viewerGesturePolicy'

const screenFitStyle: Record<ScreenFit, string> = {
  width:
    '[&_li]:flex [&_li]:justify-center [&_li]:items-center [&_li]:w-[var(--image-width)]! [&_li]:left-1/2! [&_li]:-translate-x-1/2 [&_img]:max-w-full [&_img]:max-h-fit',
  all: 'pt-safe px-safe [&_li]:flex [&_li]:justify-center [&_li]:items-center [&_li]:w-[var(--image-width)]! [&_li]:left-1/2! [&_li]:-translate-x-1/2 [&_img]:max-w-full [&_img]:max-h-dvh',
  height:
    '[&_li]:flex [&_li]:items-center [&_li]:w-fit! [&_li]:max-w-full [&_li]:left-1/2! [&_li]:-translate-x-1/2 [&_li]:overflow-x-auto [&_li]:overscroll-x-none [&_img]:w-auto [&_img]:max-w-fit [&_img]:h-dvh [&_img]:max-h-fit',
}

type Props = {
  isLowDataMode: boolean
  manga: Manga
  onClick: () => void
}

type RowProps = {
  isLowDataMode: boolean
  manga: Manga
}

export default function ScrollViewer({ isLowDataMode, manga, onClick }: Props) {
  const listRef = useListRef(null)
  const brightness = useBrightnessStore((state) => state.brightness)
  const imageWidth = useImageWidthStore((state) => state.imageWidth)
  const zoomLevel = useZoomStore((state) => state.zoomLevel)
  const setListRef = useVirtualScrollStore((state) => state.setListRef)
  const isDoublePage = usePageViewStore((state) => state.pageView === 'double')
  const screenFit = useScreenFitStore((state) => state.screenFit)
  const rowHeight = useDynamicRowHeight({ defaultRowHeight: window.innerHeight })

  const { images = [] } = manga
  const pageCount = images.length + 1
  const overscanCount = isLowDataMode ? 1 : 2
  const totalItemCount = isDoublePage ? Math.ceil(pageCount / 2) : pageCount

  const dynamicStyle = {
    '--image-width': `${imageWidth}%`,
    filter: `brightness(${brightness}%)`,
    transform: `scale(${zoomLevel})`,
  } as CSSProperties

  useInitialViewerPage({ maxIndex: images.length })

  // NOTE: virtualizer 초기화 및 정리
  useEffect(() => {
    setListRef(listRef)
    return () => setListRef(null)
  }, [listRef, setListRef])

  if (images.length === 0) {
    return (
      <output className="flex items-center justify-center h-dvh animate-fade-in" onClick={onClick}>
        <Loader2 aria-hidden="true" className="size-8 animate-spin" />
        <span className="sr-only">이미지 불러오는 중</span>
      </output>
    )
  }

  return (
    <div
      className={`overflow-hidden h-dvh contain-strict ${NATIVE_GESTURE_BLOCK_CSS}`}
      onClick={onClick}
      style={dynamicStyle}
    >
      <List
        className={`overscroll-none ${screenFitStyle[screenFit]}`}
        listRef={listRef}
        overscanCount={overscanCount}
        rowComponent={ScrollViewerRow}
        rowCount={totalItemCount}
        rowHeight={rowHeight}
        rowProps={{ isLowDataMode, manga }}
      />
    </div>
  )
}

function ScrollViewerRow({ index, isLowDataMode, style, manga }: RowComponentProps<RowProps>) {
  const currentPageIndex = usePageNavigationStore((state) => state.pageIndex)
  const navigateToPageIndex = usePageNavigationStore((state) => state.navigateToPageIndex)
  const isDoublePage = usePageViewStore((state) => state.pageView === 'double')
  const isRTL = useReadingDirectionStore((state) => state.readingDirection === 'rtl')

  const { images = [] } = manga
  const firstPageIndex = isDoublePage ? index * 2 : index
  const nextPageIndex = firstPageIndex + 1
  const isCurrentRow = index === (isDoublePage ? Math.floor(currentPageIndex / 2) : currentPageIndex)
  const fetchPriority = !isLowDataMode || isCurrentRow ? 'high' : 'low'

  const { ref: inViewRef, inView } = useInView({
    threshold: 0,
    rootMargin: '-50% 0% -50% 0%',
  })

  useEffect(() => {
    if (inView) {
      navigateToPageIndex(firstPageIndex, {
        maxIndex: images.length,
        scroll: false,
      })
    }
  }, [firstPageIndex, images.length, inView, navigateToPageIndex])

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

  const first = renderPage(firstPageIndex)
  const second = isDoublePage ? renderPage(nextPageIndex) : null

  return (
    <li ref={inViewRef} style={style}>
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
