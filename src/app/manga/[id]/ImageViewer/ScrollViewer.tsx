import { MessageCircle } from 'lucide-react'
import Link from 'next/link'
import { CSSProperties, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { List, RowComponentProps, useDynamicRowHeight, useListRef } from 'react-window'

import { MangaIdSearchParam } from '@/app/manga/[id]/common'
import BookmarkButton from '@/components/card/BookmarkButton'
import IconSpinner from '@/components/icons/IconSpinner'
import MangaImage from '@/components/MangaImage'
import { Manga } from '@/types/manga'

import RatingInput from './RatingInput'
import { useImageIndexStore } from './store/imageIndex'
import { useImageWidthStore } from './store/imageWidth'
import { PageView } from './store/pageView'
import { ReadingDirection } from './store/readingDirection'
import { ScreenFit } from './store/screenFit'
import { useVirtualScrollStore } from './store/virtualizer'

const screenFitStyle: Record<ScreenFit, string> = {
  width:
    '[&_li]:flex [&_li]:justify-center [&_li]:items-center [&_li]:w-[var(--image-width)]! [&_li]:left-1/2! [&_li]:-translate-x-1/2 [&_img]:max-w-full [&_img]:max-h-fit',
  all: '[&_li]:flex [&_li]:justify-center [&_li]:items-center [&_li]:w-[var(--image-width)]! [&_li]:left-1/2! [&_li]:-translate-x-1/2 [&_img]:max-w-full [&_img]:max-h-dvh',
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
  manga: Manga
  onClick: () => void
  pageView: PageView
  readingDirection: ReadingDirection
  screenFit: ScreenFit
}

type RowProps = {
  manga: Manga
  pageView: PageView
  readingDirection: ReadingDirection
  screenFit: ScreenFit
}

export default function ScrollViewer({ manga, onClick, pageView, readingDirection, screenFit }: Props) {
  const { images = [] } = manga
  const listRef = useListRef(null)
  const imageWidth = useImageWidthStore((state) => state.imageWidth)
  const setListRef = useVirtualScrollStore((state) => state.setListRef)
  const scrollToRow = useVirtualScrollStore((state) => state.scrollToRow)
  const isDoublePage = pageView === 'double'
  const imagePageCount = isDoublePage ? Math.ceil(images.length / 2) : images.length
  const totalItemCount = imagePageCount + 1 // +1 for rating page
  const rowHeight = useDynamicRowHeight({ defaultRowHeight: window.innerHeight })
  const dynamicStyle = { '--image-width': `${imageWidth}%` } as CSSProperties

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
        <IconSpinner className="size-8" />
      </div>
    )
  }

  return (
    <div className={`overflow-hidden h-dvh select-none contain-strict`} onClick={onClick} style={dynamicStyle}>
      <List
        className={`overscroll-none ${screenFitStyle[screenFit]}`}
        listRef={listRef}
        overscanCount={2}
        rowComponent={ScrollViewerRow}
        rowCount={totalItemCount}
        rowHeight={rowHeight}
        rowProps={{ manga, pageView, readingDirection, screenFit }}
      />
    </div>
  )
}

function LastPage({ manga, style }: LastPageProps) {
  const { id } = manga

  return (
    <li className="h-full pb-safe px-safe" style={style}>
      <div className="flex flex-col items-center gap-4 p-4 py-12">
        <RatingInput className="flex-1" mangaId={id} />
        <div className="grid grid-cols-2 items-center gap-2 text-sm font-medium text-foreground">
          <Link
            className="flex items-center gap-2 p-4 py-2 border border-foreground/20 rounded-lg hover:bg-foreground/10 transition"
            href={`/manga/${id}/detail`}
          >
            <MessageCircle className="size-4" />
            작품 후기
          </Link>
          <BookmarkButton
            className="p-4 w-full py-2 border border-foreground/20 rounded-lg hover:bg-foreground/10 transition"
            manga={manga}
          />
        </div>
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

function ScrollViewerRowItem({ index, manga, pageView, readingDirection, style }: RowComponentProps<RowProps>) {
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
    <picture>
      <source media={`(min-width: ${firstImage?.thumbnail?.width ?? 0}px)`} srcSet={firstImage?.original?.url} />
      <MangaImage fetchPriority="high" imageIndex={firstImageIndex} ref={inViewRef} src={firstImage?.thumbnail?.url} />
    </picture>
  )

  const second = isDoublePage && nextImageIndex < images.length && (
    <picture>
      <source media={`(min-width: ${nextImage?.thumbnail?.width ?? 0}px)`} srcSet={nextImage?.original?.url} />
      <MangaImage fetchPriority="high" imageIndex={nextImageIndex} src={nextImage?.thumbnail?.url} />
    </picture>
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
