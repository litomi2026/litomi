import { cleanup } from '@testing-library/react'
import { afterEach, describe, expect, mock, test } from 'bun:test'
import { type ReactElement, type ReactNode, useLayoutEffect } from 'react'

import type { GETV1ReadingHistoryResponse } from '@/backend/api/v1/library/history/GET'

import { render } from '../../../../../test/utils/render'
import { LibrarySelectionProvider, useLibrarySelection } from '../librarySelection'

const fetchNextPageMock = mock(() => Promise.resolve())

type ReadingHistoryQueryResult = {
  data: {
    pageParams: (string | null)[]
    pages: GETV1ReadingHistoryResponse[]
  }
  fetchNextPage: typeof fetchNextPageMock
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
}

let readingHistoryResult: ReadingHistoryQueryResult = {
  data: {
    pages: [{ items: [], nextCursor: null }],
    pageParams: [null],
  },
  fetchNextPage: fetchNextPageMock,
  hasNextPage: false,
  isFetchingNextPage: false,
  isFetchNextPageError: false,
}

mock.module('@/components/card/MangaCard', () => ({
  default: () => <div>manga-card</div>,
  MangaCardSkeleton: () => <div>manga-card-skeleton</div>,
}))

mock.module('@/components/ui/LoadMoreRetryButton', () => ({
  default: () => <button type="button">retry</button>,
}))

mock.module('@/hook/useInfiniteScrollObserver', () => ({
  default: mock(() => null),
}))

mock.module('@/hook/useMangaListCachedQuery', () => ({
  default: mock(() => ({ mangaMap: new Map() })),
}))

mock.module('../CensoredManga', () => ({
  default: () => null,
}))

mock.module('../SelectableMangaCard', () => ({
  default: () => <div>selectable-card</div>,
}))

mock.module('./useReadingHistoryInfiniteQuery', () => ({
  default: mock(() => readingHistoryResult),
}))

const { default: HistoryPageClient } = await import('./HistoryPageClient')

function renderWithLibrarySelection(ui: ReactElement, selectionMode = false) {
  return render(
    <LibrarySelectionProvider scopeKey="history-test">
      <SelectionModeController selectionMode={selectionMode}>{ui}</SelectionModeController>
    </LibrarySelectionProvider>,
  )
}

function SelectionModeController({ children, selectionMode }: { children: ReactNode; selectionMode: boolean }) {
  const { enter, exit } = useLibrarySelection()

  useLayoutEffect(() => {
    if (selectionMode) {
      enter()
      return
    }

    exit()
  }, [enter, exit, selectionMode])

  return <>{children}</>
}

afterEach(() => {
  cleanup()
  fetchNextPageMock.mockClear()
  readingHistoryResult = {
    data: {
      pages: [{ items: [], nextCursor: null }],
      pageParams: [null],
    },
    fetchNextPage: fetchNextPageMock,
    hasNextPage: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
  }
})

describe('HistoryPageClient', () => {
  test('감상 기록이 비어 있으면 empty state를 렌더링한다', () => {
    const view = renderWithLibrarySelection(<HistoryPageClient initialData={{ items: [], nextCursor: null }} />)

    expect(view.getByText('아직 읽은 작품이 없어요')).toBeTruthy()
  })

  test('다음 페이지가 남아 있으면 empty state를 바로 렌더링하지 않는다', () => {
    readingHistoryResult = {
      ...readingHistoryResult,
      hasNextPage: true,
      data: {
        pages: [{ items: [], nextCursor: 'next-cursor' }],
        pageParams: [null],
      },
    }

    const view = renderWithLibrarySelection(<HistoryPageClient initialData={{ items: [], nextCursor: 'next-cursor' }} />)

    expect(view.queryByText('아직 읽은 작품이 없어요')).toBeNull()
  })
})
