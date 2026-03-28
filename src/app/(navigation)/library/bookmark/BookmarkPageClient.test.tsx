import { cleanup } from '@testing-library/react'
import { afterEach, describe, expect, mock, test } from 'bun:test'

import type { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark/GET'

import { render } from '../../../../../test/utils/render'

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

let isSelectionMode = false
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

mock.module('../librarySelection', () => ({
  useLibrarySelection: mock(() => ({ isSelectionMode })),
}))

mock.module('../SelectableMangaCard', () => ({
  default: () => <div>selectable-card</div>,
}))

mock.module('./useBookmarkInfiniteQuery', () => ({
  default: mock(() => bookmarkResult),
}))

const { default: BookmarkPageClient } = await import('./BookmarkPageClient')

afterEach(() => {
  cleanup()
  fetchNextPageMock.mockClear()
  isSelectionMode = false
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
    const view = render(<BookmarkPageClient initialData={{ bookmarks: [], nextCursor: null }} />)

    expect(view.getByText('북마크가 비어 있어요')).toBeTruthy()
  })

  test('선택 모드에서는 선택 가능한 카드 컴포넌트를 렌더링한다', () => {
    isSelectionMode = true
    bookmarkResult = {
      ...bookmarkResult,
      data: {
        pages: [{ bookmarks: [{ mangaId: 101, createdAt: Date.now() }], nextCursor: null }],
        pageParams: [null],
      },
    }

    const view = render(
      <BookmarkPageClient initialData={{ bookmarks: [{ mangaId: 101, createdAt: Date.now() }], nextCursor: null }} />,
    )

    expect(view.getByText('selectable-card')).toBeTruthy()
  })
})
