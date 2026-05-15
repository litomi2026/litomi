import type { ReactNode } from 'react'

export type ReaderLayout<TPage extends ReaderPage> = {
  pageIndexByReadablePageNumber: number[]
  readablePageCount: number
  readablePageNumberByPageIndex: (number | null)[]
  spreadIndexByPageIndex: number[]
  spreads: ReaderSpread<TPage>[]
}

export type ReaderLayoutOptions = {
  /**
   * Double-page mode aligns spreads so this page starts the active spread.
   */
  doublePageAnchorIndex?: number
  pageView: ReaderPageView
}

export type ReaderPage = {
  id: string
  /**
   * `skip` keeps utility pages such as ads, CTAs, and end cards out of readable progress.
   */
  progressMode?: ReaderPageProgressMode
  /**
   * `solo` always renders this page alone in double-page mode.
   * Omit this or use `pairable` when the page may share a spread with the next page.
   */
  spreadMode?: ReaderPageSpreadMode
}

export type ReaderPageProgressMode = 'count' | 'skip'

export type ReaderPageRenderContext<TPage extends ReaderPage> = {
  fetchPriority: 'high' | 'low'
  isActive: boolean
  isLowDataMode: boolean
  page: TPage
  pageIndex: number
  spreadIndex: number
}

export type ReaderPageRenderer<TPage extends ReaderPage> = (context: ReaderPageRenderContext<TPage>) => ReactNode

export type ReaderPageSpreadMode = 'pairable' | 'solo'

export type ReaderPageView = 'double' | 'single'

export type ReaderSpread<TPage extends ReaderPage> = {
  id: string
  pageIndexes: number[]
  pages: TPage[]
  startPageIndex: number
}

type NonEmptyArray<T> = [T, ...T[]]

export function createReaderLayout<TPage extends ReaderPage>(
  pages: readonly TPage[],
  { doublePageAnchorIndex, pageView }: ReaderLayoutOptions,
): ReaderLayout<TPage> {
  const spreads =
    pageView === 'single'
      ? pages.map((page, pageIndex) => createReaderSpread([page], [pageIndex]))
      : createReaderSpreads(pages, doublePageAnchorIndex ?? 0)

  const spreadIndexByPageIndex = Array(pages.length).fill(0)

  spreads.forEach((spread, spreadIndex) => {
    spread.pageIndexes.forEach((pageIndex) => {
      spreadIndexByPageIndex[pageIndex] = spreadIndex
    })
  })

  const { pageIndexByReadablePageNumber, readablePageCount, readablePageNumberByPageIndex } =
    buildReaderPageProgress(pages)

  return {
    pageIndexByReadablePageNumber,
    readablePageCount,
    readablePageNumberByPageIndex,
    spreadIndexByPageIndex,
    spreads,
  }
}

function buildReaderPageProgress<TPage extends ReaderPage>(pages: readonly TPage[]) {
  const pageIndexByReadablePageNumber: number[] = []
  const readablePageNumberByPageIndex: (number | null)[] = []
  let readablePageCount = 0

  pages.forEach((page, pageIndex) => {
    if (page.progressMode === 'skip') {
      readablePageNumberByPageIndex[pageIndex] = readablePageCount > 0 ? readablePageCount : null
      return
    }

    readablePageCount += 1
    readablePageNumberByPageIndex[pageIndex] = readablePageCount
    pageIndexByReadablePageNumber[readablePageCount] = pageIndex
  })

  return {
    pageIndexByReadablePageNumber,
    readablePageCount,
    readablePageNumberByPageIndex,
  }
}

function createReaderSpread<TPage extends ReaderPage>(
  pages: NonEmptyArray<TPage>,
  pageIndexes: NonEmptyArray<number>,
): ReaderSpread<TPage> {
  return {
    id: pages.map((page) => page.id).join(':'),
    pageIndexes,
    pages,
    startPageIndex: pageIndexes[0],
  }
}

function createReaderSpreads<TPage extends ReaderPage>(
  pages: readonly TPage[],
  doublePageAnchorIndex: number,
): ReaderSpread<TPage>[] {
  if (pages.length === 0) {
    return []
  }

  const anchorPageIndex = Math.min(Math.max(0, doublePageAnchorIndex), pages.length - 1)
  const spreads: ReaderSpread<TPage>[] = []

  function createForwardSpread(pageIndex: number) {
    const firstPage = pages[pageIndex]!
    const nextPageIndex = pageIndex + 1
    const nextPage = pages[nextPageIndex]

    if (!nextPage || firstPage.spreadMode === 'solo' || nextPage.spreadMode === 'solo') {
      return createReaderSpread([firstPage], [pageIndex])
    }

    return createReaderSpread([firstPage, nextPage], [pageIndex, nextPageIndex])
  }

  for (let pageIndex = anchorPageIndex - 1; pageIndex >= 0; ) {
    const page = pages[pageIndex]!
    const previousPageIndex = pageIndex - 1
    const previousPage = pages[previousPageIndex]

    if (!previousPage || page.spreadMode === 'solo' || previousPage.spreadMode === 'solo') {
      spreads.unshift(createReaderSpread([page], [pageIndex]))
      pageIndex -= 1
      continue
    }

    spreads.unshift(createReaderSpread([previousPage, page], [previousPageIndex, pageIndex]))
    pageIndex -= 2
  }

  const activeSpread = createForwardSpread(anchorPageIndex)
  spreads.push(activeSpread)

  let nextPageIndex = anchorPageIndex + activeSpread.pageIndexes.length

  while (nextPageIndex < pages.length) {
    const spread = createForwardSpread(nextPageIndex)

    spreads.push(spread)
    nextPageIndex += spread.pageIndexes.length
  }

  return spreads
}
