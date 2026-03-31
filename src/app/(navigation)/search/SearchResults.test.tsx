import '@test/setup.dom'
import { createTestNavigationWrapper } from '@test/utils/navigation'
import { cleanup, render } from '@testing-library/react'
import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

import { View } from '@/utils/param'

type SearchQueryState = {
  data: {
    pages: Array<{
      mangas: Array<{ id: number; title: string; images: []; count: number }>
      promotion?: { position?: number }
    }>
  } | null
  error: Error | null
  fetchNextPage: () => Promise<void>
  hasNextPage: boolean
  isFetchingNextPage: boolean
  isFetchNextPageError: boolean
  isLoading: boolean
  isRefetchError: boolean
  isRefetching: boolean
  refetch: () => Promise<void>
}

let searchQueryState: SearchQueryState

mock.module('@/components/card/MangaCard', () => ({
  default: ({
    showSearchFromNextButton = false,
    variant = 'card',
  }: {
    showSearchFromNextButton?: boolean
    variant?: string
  }) => <div>{`manga-card-${variant}-${showSearchFromNextButton ? 'search' : 'plain'}`}</div>,
  MangaCardSkeleton: ({ variant = 'card' }: { variant?: string }) => <div>{`manga-card-skeleton-${variant}`}</div>,
}))

mock.module('@/components/card/MangaCardPromotion', () => ({
  default: () => <div>promotion-card</div>,
}))

mock.module('@/components/ui/LoadMoreRetryButton', () => ({
  default: () => <div>retry-button</div>,
}))

mock.module('@/hook/useInfiniteScrollObserver', () => ({
  default: () => ({ current: null }),
}))

mock.module('../(top-navigation)/RandomRefreshButton', () => ({
  default: () => null,
}))

mock.module('./useSearchQuery', () => ({
  useSearchQuery: () => searchQueryState,
}))

const { default: SearchResult, SearchResultLoading } = await import('./SearchResults')

beforeEach(() => {
  searchQueryState = {
    data: {
      pages: [
        {
          mangas: [{ id: 101, title: 'Manga 101', images: [], count: 10 }],
          promotion: { position: 0 },
        },
      ],
    },
    error: null,
    fetchNextPage: async () => {},
    hasNextPage: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    isLoading: false,
    isRefetchError: false,
    isRefetching: false,
    refetch: async () => {},
  }
  window.history.replaceState({}, '', '/search')
})

afterEach(() => {
  cleanup()
})

afterAll(() => {
  mock.restore()
})

describe('SearchResult', () => {
  test('카드 보기에서는 카드 variant와 프로모션 카드를 렌더링한다', () => {
    const view = render(<SearchResult />, {
      wrapper: createTestNavigationWrapper({ pathname: '/search' }),
    })

    expect(view.getByText('promotion-card')).toBeTruthy()
    expect(view.getByText('manga-card-card-search')).toBeTruthy()
  })

  test('그림 보기에서는 image variant를 렌더링하고 프로모션 카드는 숨긴다', () => {
    window.history.replaceState({}, '', '/search?view=img')

    const view = render(<SearchResult />, {
      wrapper: createTestNavigationWrapper({
        pathname: '/search',
        searchParams: new URLSearchParams(window.location.search),
      }),
    })

    expect(view.getByText('manga-card-img-plain')).toBeTruthy()
    expect(view.queryByText('promotion-card')).toBeNull()
  })
})

describe('SearchResultLoading', () => {
  test('그림 보기에서는 image skeleton을 12개 렌더링한다', () => {
    const view = render(<SearchResultLoading view={View.IMAGE} />)

    expect(view.getAllByText('manga-card-skeleton-img')).toHaveLength(12)
  })
})
