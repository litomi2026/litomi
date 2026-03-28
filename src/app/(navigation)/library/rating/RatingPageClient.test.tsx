import { cleanup } from '@testing-library/react'
import { afterEach, describe, expect, mock, test } from 'bun:test'

import type { GETV1RatingsResponse } from '@/backend/api/v1/library/rating/GET'

import { isGroupedRatingSort, RatingSort } from '@/backend/api/v1/library/enum'

import { fireEvent, render } from '../../../../../test/utils/render'

const fetchNextPageMock = mock(() => Promise.resolve())
const exitSelectionModeMock = mock(() => undefined)

const basePage: GETV1RatingsResponse = {
  items: [
    {
      mangaId: 100,
      rating: 4,
      createdAt: new Date('2025-01-01T00:00:00.000Z').getTime(),
      updatedAt: new Date('2025-01-02T00:00:00.000Z').getTime(),
    },
  ],
  nextCursor: null,
}

type RatingsQueryResult = {
  data?: {
    pageParams: (string | null)[]
    pages: GETV1RatingsResponse[]
  }
  fetchNextPage: typeof fetchNextPageMock
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  isLoading: boolean
}

let ratingsResult: RatingsQueryResult = {
  data: {
    pages: [basePage],
    pageParams: [null],
  },
  fetchNextPage: fetchNextPageMock,
  hasNextPage: false,
  isFetchingNextPage: false,
  isFetchNextPageError: false,
  isLoading: false,
}

const useRatingInfiniteQueryCalls: Array<{
  initialData: GETV1RatingsResponse | undefined
  sort: RatingSort
}> = []

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
  useLibrarySelectionActions: mock(() => ({
    exit: exitSelectionModeMock,
  })),
  useLibrarySelectionState: mock(() => ({
    isSelectionMode: false,
  })),
}))

mock.module('../CensoredManga', () => ({
  default: () => null,
}))

mock.module('../SelectableMangaCard', () => ({
  default: () => <div>selectable-card</div>,
}))

mock.module('./useRatingInfiniteQuery', () => ({
  default: mock((initialData: GETV1RatingsResponse | undefined, sort: RatingSort) => {
    useRatingInfiniteQueryCalls.push({ initialData, sort })
    return ratingsResult
  }),
}))

const { default: RatingPageClient } = await import('./RatingPageClient')

afterEach(() => {
  cleanup()
  fetchNextPageMock.mockClear()
  exitSelectionModeMock.mockClear()
  useRatingInfiniteQueryCalls.length = 0
  ratingsResult = {
    data: {
      pages: [basePage],
      pageParams: [null],
    },
    fetchNextPage: fetchNextPageMock,
    hasNextPage: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    isLoading: false,
  }
  window.history.replaceState({}, '', '/library/rating')
})

describe('RatingPageClient', () => {
  test('manga id 정렬 옵션을 렌더링한다', () => {
    const view = render(<RatingPageClient initialData={basePage} />)

    expect(view.getByRole('option', { name: '작품 ID 높은순' })).toBeTruthy()
    expect(view.getByRole('option', { name: '작품 ID 낮은순' })).toBeTruthy()
  })

  test('평점 정렬만 그룹 렌더링 대상으로 판단한다', () => {
    expect(isGroupedRatingSort(RatingSort.RATING_DESC)).toBe(true)
    expect(isGroupedRatingSort(RatingSort.RATING_ASC)).toBe(true)
    expect(isGroupedRatingSort(RatingSort.MANGA_ID_ASC)).toBe(false)
  })

  test('manga id 정렬로 바꾸면 새 쿼리에는 초기 SSR 데이터를 재사용하지 않는다', () => {
    const view = render(<RatingPageClient initialData={basePage} initialSort={RatingSort.UPDATED_DESC} />)

    fireEvent.change(view.getByRole('combobox'), {
      target: { value: RatingSort.MANGA_ID_ASC },
    })

    expect(exitSelectionModeMock).toHaveBeenCalledTimes(1)
    expect(useRatingInfiniteQueryCalls).toEqual([
      { initialData: basePage, sort: RatingSort.UPDATED_DESC },
      { initialData: undefined, sort: RatingSort.MANGA_ID_ASC },
    ])
    expect(window.location.search).toBe(`?sort=${RatingSort.MANGA_ID_ASC}`)
  })

  test('manga id 정렬에서는 평점 그룹 헤더를 렌더링하지 않는다', () => {
    const view = render(<RatingPageClient initialData={basePage} initialSort={RatingSort.MANGA_ID_ASC} />)

    expect(view.queryByText('(4점)')).toBeNull()
  })

  test('정렬을 변경해 새 데이터가 아직 없어도 스켈레톤을 렌더링하며 크래시하지 않는다', () => {
    const view = render(<RatingPageClient initialData={basePage} initialSort={RatingSort.UPDATED_DESC} />)

    ratingsResult = {
      data: undefined,
      fetchNextPage: fetchNextPageMock,
      hasNextPage: false,
      isFetchingNextPage: false,
      isFetchNextPageError: false,
      isLoading: true,
    }

    fireEvent.change(view.getByRole('combobox'), {
      target: { value: RatingSort.MANGA_ID_ASC },
    })

    expect(view.getByText('manga-card-skeleton')).toBeTruthy()
  })

  test('평점 정렬에서는 평점 그룹 헤더를 렌더링한다', () => {
    const view = render(<RatingPageClient initialData={basePage} initialSort={RatingSort.RATING_DESC} />)

    expect(view.getByText('(4점)')).toBeTruthy()
  })

  test('평가가 비어 있으면 empty state를 렌더링한다', () => {
    ratingsResult = {
      data: {
        pages: [{ items: [], nextCursor: null }],
        pageParams: [null],
      },
      fetchNextPage: fetchNextPageMock,
      hasNextPage: false,
      isFetchingNextPage: false,
      isFetchNextPageError: false,
      isLoading: false,
    }

    const view = render(<RatingPageClient initialData={{ items: [], nextCursor: null }} />)

    expect(view.getByText('아직 평가한 작품이 없어요')).toBeTruthy()
  })
})
