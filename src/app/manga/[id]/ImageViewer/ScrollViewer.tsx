import { Loader2 } from 'lucide-react'
import { CSSProperties, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { List, RowComponentProps, useDynamicRowHeight, useListRef } from 'react-window'

import { MangaIdSearchParam } from '@/app/manga/[id]/common'
import MangaImage from '@/components/MangaImage'
import { Manga } from '@/types/manga'

import LastPageActions from './LastPageActions'
import RatingInput from './RatingInput'
import { useBrightnessStore } from './store/brightness'
import { useImageIndexStore } from './store/imageIndex'
import { useImageWidthStore } from './store/imageWidth'
import { PageView } from './store/pageView'
import { ReadingDirection } from './store/readingDirection'
import { ScreenFit } from './store/screenFit'
import { useVirtualScrollStore } from './store/virtualizer'
import { useZoomStore } from './store/zoom'
import { getResponsivePictureSources } from './util'

const screenFitStyle: Record<ScreenFit, string> = {
  width:
    '[&_li]:flex [&_li]:justify-center [&_li]:items-center [&_li]:w-[var(--image-width)]! [&_li]:left-1/2! [&_li]:-translate-x-1/2 [&_img]:max-w-full [&_img]:max-h-fit',
  all: 'pt-safe px-safe [&_li]:flex [&_li]:justify-center [&_li]:items-center [&_li]:w-[var(--image-width)]! [&_li]:left-1/2! [&_li]:-translate-x-1/2 [&_img]:max-w-full [&_img]:max-h-dvh',
  height:
    '[&_li]:flex [&_li]:items-center [&_li]:w-fit! [&_li]:max-w-full [&_li]:left-1/2! [&_li]:-translate-x-1/2 [&_li]:overflow-x-auto [&_li]:overscroll-x-none [&_img]:w-auto [&_img]:max-w-fit [&_img]:h-dvh [&_img]:max-h-fit',
}

type LastPageProps = {
  manga: {
    id: number
  }
  style: CSSProperties
}

type Props = {
  isLowDataMode: boolean
  manga: Manga
  onClick: () => void
  pageView: PageView
  readingDirection: ReadingDirection
  screenFit: ScreenFit
}

type RowProps = {
  isLowDataMode: boolean
  manga: Manga
  pageView: PageView
  readingDirection: ReadingDirection
  screenFit: ScreenFit
}

export default function ScrollViewer({ isLowDataMode, manga, onClick, pageView, readingDirection, screenFit }: Props) {
  const { images = [] } = manga
  const listRef = useListRef(null)
  const brightness = useBrightnessStore((state) => state.brightness)
  const imageWidth = useImageWidthStore((state) => state.imageWidth)
  const zoomLevel = useZoomStore((state) => state.zoomLevel)
  const setListRef = useVirtualScrollStore((state) => state.setListRef)
  const scrollToRow = useVirtualScrollStore((state) => state.scrollToRow)
  const isDoublePage = pageView === 'double'
  const imagePageCount = isDoublePage ? Math.ceil(images.length / 2) : images.length
  const overscanCount = isLowDataMode ? 1 : 2
  const totalItemCount = imagePageCount + 1 // +1 for rating page
  const rowHeight = useDynamicRowHeight({ defaultRowHeight: window.innerHeight })

  const dynamicStyle = {
    '--image-width': `${imageWidth}%`,
    filter: `brightness(${brightness}%)`,
    transform: `scale(${zoomLevel})`,
  } as CSSProperties

  // NOTE: page 파라미터가 있으면 초기 페이지를 변경함
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const pageStr = params.get(MangaIdSearchParam.PAGE) ?? ''
    const parsedPage = parseInt(pageStr, 10)

    if (isNaN(parsedPage) || parsedPage < 1 || parsedPage > images.length) {
      return
    }

    scrollToRow(isDoublePage ? Math.floor((parsedPage - 1) / 2) : parsedPage - 1)
  }, [images.length, isDoublePage, scrollToRow])

  // NOTE: virtualizer 초기화 및 정리
  useEffect(() => {
    setListRef(listRef)
    return () => setListRef(null)
  }, [listRef, setListRef])

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center h-dvh animate-fade-in" onClick={onClick}>
        <Loader2 className="size-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className={`overflow-hidden h-dvh select-none contain-strict`} onClick={onClick} style={dynamicStyle}>
      <List
        className={`overscroll-none ${screenFitStyle[screenFit]}`}
        listRef={listRef}
        overscanCount={overscanCount}
        rowComponent={ScrollViewerRow}
        rowCount={totalItemCount}
        rowHeight={rowHeight}
        rowProps={{ isLowDataMode, manga, pageView, readingDirection, screenFit }}
      />
    </div>
  )
}

function LastPage({ manga, style }: LastPageProps) {
  const { id } = manga

  return (
    <li className="h-full" style={style}>
      <div className="flex flex-col items-center gap-4">
        <RatingInput className="flex-1" mangaId={id} />
        <LastPageActions manga={manga} />
      </div>
    </li>
  )
}

function ScrollViewerRow({ index, style, manga, pageView, ...rest }: RowComponentProps<RowProps>) {
  const { images = [] } = manga
  const isDoublePage = pageView === 'double'
  const imagePageCount = isDoublePage ? Math.ceil(images.length / 2) : images.length

  if (index === imagePageCount) {
    return <LastPage manga={manga} style={style} />
  }

  return <ScrollViewerRowItem index={index} manga={manga} pageView={pageView} style={style} {...rest} />
}

function ScrollViewerRowItem({
  index,
  isLowDataMode,
  manga,
  pageView,
  readingDirection,
  style,
}: RowComponentProps<RowProps>) {
  const navigateToImageIndex = useImageIndexStore((state) => state.navigateToImageIndex)
  const { images = [] } = manga
  const isDoublePage = pageView === 'double'
  const isRTL = readingDirection === 'rtl'
  const firstImageIndex = isDoublePage ? index * 2 : index
  const nextImageIndex = firstImageIndex + 1
  const firstImage = images[firstImageIndex]
  const nextImage = images[nextImageIndex]

  const { ref: inViewRef, inView } = useInView({
    threshold: 0,
    rootMargin: '-50% 0% -50% 0%',
  })

  useEffect(() => {
    if (inView) {
      navigateToImageIndex(firstImageIndex)
    }
  }, [firstImageIndex, inView, navigateToImageIndex])

  const first = (
    <MangaImage
      fetchPriority="high"
      imageIndex={firstImageIndex}
      mangaId={manga.id}
      pictures={getResponsivePictureSources(firstImage)}
      ref={inViewRef}
      src={firstImage?.thumbnail?.url}
      variant="thumbnail"
    />
  )

  const second = isDoublePage && nextImageIndex < images.length && (
    <MangaImage
      fetchPriority="high"
      imageIndex={nextImageIndex}
      mangaId={manga.id}
      pictures={getResponsivePictureSources(nextImage)}
      src={nextImage?.thumbnail?.url}
      variant="thumbnail"
    />
  )

  return (
    <li style={style}>
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
