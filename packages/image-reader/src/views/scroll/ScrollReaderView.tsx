import type { ReaderLayout, ReaderPage, ReaderPageRenderer } from '#reader/model/readerLayout'

import { useReaderMessages } from '#reader/context'
import { NATIVE_GESTURE_BLOCK_CSS } from '#reader/model/viewerGesturePolicy'
import { type ScreenFit, useReaderSessionStore, useReaderStore } from '#reader/state/readerStore'
import { Loader2 } from 'lucide-react'
import { type CSSProperties, Fragment, useEffect } from 'react'
import { useInView } from 'react-intersection-observer'
import { List, type RowComponentProps, useDynamicRowHeight, useListRef } from 'react-window'

const screenFitStyle: Record<ScreenFit, string> = {
  width:
    '[&_li]:flex [&_li]:justify-center [&_li]:items-center [&_li]:w-[var(--image-width)]! [&_li]:left-1/2! [&_li]:-translate-x-1/2 [&_img]:max-w-full [&_img]:max-h-fit',
  all: 'pt-safe px-safe [&_li]:flex [&_li]:justify-center [&_li]:items-center [&_li]:w-[var(--image-width)]! [&_li]:left-1/2! [&_li]:-translate-x-1/2 [&_img]:max-w-full [&_img]:max-h-dvh',
  height:
    '[&_li]:flex [&_li]:items-center [&_li]:w-fit! [&_li]:max-w-full [&_li]:left-1/2! [&_li]:-translate-x-1/2 [&_li]:overflow-x-auto [&_li]:overscroll-x-none [&_img]:w-auto [&_img]:max-w-fit [&_img]:h-dvh [&_img]:max-h-fit',
}

const DEFAULT_SCROLL_ROW_HEIGHT = 800

export type Props<TPage extends ReaderPage> = {
  isLowDataMode: boolean
  onClick: () => void
  readerLayout: ReaderLayout<TPage>
  renderPage: ReaderPageRenderer<TPage>
}

type RowProps<TPage extends ReaderPage> = {
  isLowDataMode: boolean
  readerLayout: ReaderLayout<TPage>
  renderPage: ReaderPageRenderer<TPage>
}

export default function ScrollReaderView<TPage extends ReaderPage>({
  isLowDataMode,
  onClick,
  readerLayout,
  renderPage,
}: Props<TPage>) {
  const listRef = useListRef(null)
  const brightness = useReaderSessionStore((state) => state.brightness)
  const imageWidth = useReaderStore((state) => state.imageWidth)
  const screenFit = useReaderStore((state) => state.screenFit)
  const scrollTargetPageIndex = useReaderStore((state) => state.scrollTargetPageIndex)
  const clearScrollTargetPageIndex = useReaderStore((state) => state.clearScrollTargetPageIndex)
  const rowHeight = useDynamicRowHeight({ defaultRowHeight: DEFAULT_SCROLL_ROW_HEIGHT })
  const messages = useReaderMessages()

  const overscanCount = isLowDataMode ? 1 : 3
  const maxPage = readerLayout.spreadIndexByPageIndex.length

  const dynamicStyle = {
    '--image-width': `${imageWidth}%`,
    filter: `brightness(${brightness}%)`,
  } as CSSProperties

  // NOTE: 외부 컨트롤에서 페이지 이동을 요청하면 현재 spread layout 기준으로 해당 row를 보여줘요.
  useEffect(() => {
    const list = listRef.current

    if (scrollTargetPageIndex === null || !list) {
      return
    }

    list.scrollToRow({
      align: 'center',
      behavior: 'instant',
      index: readerLayout.spreadIndexByPageIndex[scrollTargetPageIndex] ?? scrollTargetPageIndex,
    })

    clearScrollTargetPageIndex()
  }, [clearScrollTargetPageIndex, listRef, readerLayout, scrollTargetPageIndex])

  if (maxPage === 0) {
    return (
      <output className="flex items-center justify-center h-dvh animate-fade-in" onClick={onClick}>
        <Loader2 aria-hidden="true" className="size-8 animate-spin" />
        <span className="sr-only">{messages.loadingImages}</span>
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
        rowComponent={ScrollReaderViewRow}
        rowCount={readerLayout.spreads.length}
        rowHeight={rowHeight}
        rowProps={{ isLowDataMode, readerLayout, renderPage }}
      />
    </div>
  )
}

function ScrollReaderViewRow<TPage extends ReaderPage>({
  index,
  isLowDataMode,
  readerLayout,
  renderPage,
  style,
}: RowComponentProps<RowProps<TPage>>) {
  const currentPageIndex = useReaderStore((state) => state.pageIndex)
  const navigateToPageIndex = useReaderStore((state) => state.navigateToPageIndex)
  const isLTR = useReaderStore((state) => state.readingDirection === 'ltr')

  const spread = readerLayout.spreads[index]
  const firstPageIndex = spread?.startPageIndex ?? 0
  const isCurrentRow = index === (readerLayout.spreadIndexByPageIndex[currentPageIndex] ?? currentPageIndex)
  const fetchPriority = !isLowDataMode || isCurrentRow ? 'high' : 'low'
  const maxPage = readerLayout.spreadIndexByPageIndex.length

  const { ref: inViewRef, inView } = useInView({
    threshold: 0,
    rootMargin: '-50% 0% -50% 0%',
  })

  // NOTE: 사용자가 스크롤해서 페이지가 바뀐 상황을 상태에 기록해요.
  useEffect(() => {
    if (inView && spread) {
      navigateToPageIndex(firstPageIndex, {
        maxIndex: Math.max(0, maxPage - 1),
        navigationType: 'relative',
        scroll: false,
      })
    }
  }, [firstPageIndex, inView, navigateToPageIndex, maxPage, spread])

  if (!spread) {
    return null
  }

  const spreadPages = spread.pages.map((page, pageOffset) => ({
    page,
    pageIndex: spread.pageIndexes[pageOffset] ?? spread.startPageIndex,
  }))

  const orderedSpreadPages = isLTR ? spreadPages : [...spreadPages].reverse()

  return (
    <li ref={inViewRef} style={style}>
      {orderedSpreadPages.map(({ page, pageIndex }) => (
        <Fragment key={page.id}>
          {renderPage({
            fetchPriority,
            isActive: isCurrentRow,
            isLowDataMode,
            page,
            pageIndex,
            spreadIndex: index,
          })}
        </Fragment>
      ))}
    </li>
  )
}
