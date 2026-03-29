import { cleanup } from '@testing-library/react'
import { afterEach, describe, expect, mock, test } from 'bun:test'
import { type ReactElement, type ReactNode, useLayoutEffect } from 'react'

import type { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark/GET'

import { render } from '../../../../../test/utils/render'
import { LibrarySelectionProvider, useLibrarySelection } from '../librarySelection'

const fetchNextPageMock = mock(() => Promise.resolve())

type BookmarkQueryResult = {
  data?: {
    pageParams: (string | null)[]
    pages: GETV1BookmarkResponse[]
  }
  fetchNextPage: typeof fetchNextPageMock
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
}

let bookmarkResult: BookmarkQueryResult = {
  data: {
    pages: [{ bookmarks: [], nextCursor: null }],
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

mock.module('../SelectableMangaCard', () => ({
  default: () => <div>selectable-card</div>,
}))

mock.module('./useBookmarkInfiniteQuery', () => ({
  default: mock(() => bookmarkResult),
}))

const { default: BookmarkPageClient } = await import('./BookmarkPageClient')

function renderWithLibrarySelection(ui: ReactElement, selectionMode = false) {
  return render(
    <LibrarySelectionProvider scopeKey="bookmark-test">
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
  bookmarkResult = {
    data: {
      pages: [{ bookmarks: [], nextCursor: null }],
      pageParams: [null],
    },
    fetchNextPage: fetchNextPageMock,
    hasNextPage: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
  }
})

describe('BookmarkPageClient', () => {
  test('북마크가 비어 있으면 empty state를 렌더링한다', () => {
    const view = renderWithLibrarySelection(<BookmarkPageClient initialData={{ bookmarks: [], nextCursor: null }} />)

    expect(view.getByText('북마크가 비어 있어요')).toBeTruthy()
  })

  test('선택 모드에서는 선택 가능한 카드 컴포넌트를 렌더링한다', () => {
    bookmarkResult = {
      ...bookmarkResult,
      data: {
        pages: [{ bookmarks: [{ mangaId: 101, createdAt: Date.now() }], nextCursor: null }],
        pageParams: [null],
      },
    }

    const view = renderWithLibrarySelection(
      <BookmarkPageClient initialData={{ bookmarks: [{ mangaId: 101, createdAt: Date.now() }], nextCursor: null }} />,
      true,
    )

    expect(view.getByText('selectable-card')).toBeTruthy()
  })
})
