import '@test/setup.dom'
import { createTestNavigationWrapper } from '@test/utils/navigation'
import { renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

import { View } from '@/utils/param'

type SearchQueryState = {
  data: {
    pages: Array<{
      mangas: Array<{ id: number; title: string; images: []; count: number }>
      promotion?: {
        id: string
        url: string
        title: string
        description: string
        badge?: string
        position?: number
      }
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
          promotion: {
            id: 'promo-101',
            url: 'https://example.com/promotion',
            title: '프로모션 작품',
            description: '추천 작품 설명',
            badge: '스폰서',
            position: 0,
          },
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
    const view = renderWithTestQueryClient(<SearchResult />, {
      wrapper: createTestNavigationWrapper({ pathname: '/search' }),
    })

    const card = view.container.querySelector('[data-manga-card]')

    expect(view.getByText('프로모션 작품')).toBeTruthy()
    expect(view.getByText('추천 작품 설명')).toBeTruthy()
    expect(card).toBeTruthy()
    expect(card?.className).toContain('flex-col')
    expect(view.getByText('Manga 101')).toBeTruthy()
  })

  test('그림 보기에서는 image variant를 렌더링하고 프로모션 카드는 숨긴다', () => {
    window.history.replaceState({}, '', '/search?view=img')

    const view = renderWithTestQueryClient(<SearchResult />, {
      wrapper: createTestNavigationWrapper({
        pathname: '/search',
        searchParams: new URLSearchParams(window.location.search),
      }),
    })

    const card = view.container.querySelector('[data-manga-card]')

    expect(card).toBeTruthy()
    expect(card?.className).not.toContain('flex-col')
    expect(view.queryByText('Manga 101')).toBeNull()
    expect(view.queryByText('프로모션 작품')).toBeNull()
  })
})

describe('SearchResultLoading', () => {
  test('그림 보기에서는 image skeleton을 12개 렌더링한다', () => {
    const view = renderWithTestQueryClient(<SearchResultLoading view={View.IMAGE} />)

    expect(view.container.querySelectorAll('ul > li')).toHaveLength(12)
  })
})
