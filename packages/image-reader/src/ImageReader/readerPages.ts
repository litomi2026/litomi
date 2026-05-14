import type { ReactNode } from 'react'

export type ReaderLayout<TPage extends ReaderPage> = {
  pageIndexByReadablePageNumber: number[]
  readablePageCount: number
  readablePageNumberByPageIndex: (number | null)[]
  spreadIndexByPageIndex: number[]
  spreads: ReaderSpread<TPage>[]
}

export type ReaderLayoutOptions = {
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
  { pageView }: ReaderLayoutOptions,
): ReaderLayout<TPage> {
  const spreads = buildReaderSpreads(pages, pageView)
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

function buildReaderSpreads<TPage extends ReaderPage>(
  pages: readonly TPage[],
  pageView: ReaderPageView,
): ReaderSpread<TPage>[] {
  if (pageView === 'single') {
    return pages.map((page, pageIndex) => createReaderSpread([page], [pageIndex]))
  }

  const spreads: ReaderSpread<TPage>[] = []
  let pageIndex = 0

  while (pageIndex < pages.length) {
    const firstPage = pages[pageIndex]

    if (!firstPage) {
      break
    }

    if (firstPage.spreadMode === 'solo') {
      spreads.push(createReaderSpread([firstPage], [pageIndex]))
      pageIndex += 1
      continue
    }

    const nextPageIndex = pageIndex + 1
    const nextPage = pages[nextPageIndex]

    if (!nextPage || nextPage.spreadMode === 'solo') {
      spreads.push(createReaderSpread([firstPage], [pageIndex]))
      pageIndex += 1
      continue
    }

    spreads.push(createReaderSpread([firstPage, nextPage], [pageIndex, nextPageIndex]))
    pageIndex += 2
  }

  return spreads
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
