import '@test/setup.dom'
import { createTestNavigationWrapper } from '@test/utils/navigation'
import { renderWithTestQueryClient } from '@test/utils/query-client'
import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

import { View } from '@/utils/param'
import { MANGA_LIST_GRID_COLUMNS } from '@/utils/style'

mock.module('@/hook/useMangaListCachedQuery', () => ({
  default: () => ({
    mangaMap: new Map([[101, { id: 101, title: 'Manga 101', images: [] }]]),
  }),
}))

mock.module('./useAllLibraryMangaInfiniteQuery', () => ({
  default: () => ({
    data: {
      pages: [
        {
          items: [
            {
              mangaId: 101,
              createdAt: new Date('2025-01-01T00:00:00.000Z').getTime(),
              library: { id: 1, name: '테스트 서재', color: null, icon: null },
            },
          ],
        },
      ],
    },
    fetchNextPage: () => Promise.resolve(),
    hasNextPage: false,
    isFetchingNextPage: false,
    isFetchNextPageError: false,
    isPending: false,
  }),
}))

const { default: AllLibraryMangaView } = await import('./AllLibraryMangaView')

beforeEach(() => {
  window.history.replaceState({}, '', '/library')
})

afterEach(() => {
  document.body.innerHTML = ''
})

afterAll(() => {
  mock.restore()
})

describe('AllLibraryMangaView', () => {
  test('initialView가 카드면 카드 토글과 카드 그리드를 초기값으로 사용한다', () => {
    const view = renderWithTestQueryClient(<AllLibraryMangaView initialView={View.CARD} />, {
      wrapper: createTestNavigationWrapper({ pathname: '/library' }),
    })

    const card = view.container.querySelector('[data-manga-card]')
    const list = view.container.querySelector('ul')

    expect(view.getByRole('radio', { name: '카드' }).getAttribute('aria-checked')).toBe('true')
    expect(card).toBeTruthy()
    expect(card?.className).toContain('flex-col')
    expect(view.getByText('Manga 101')).toBeTruthy()
    expect(list?.className).toContain(MANGA_LIST_GRID_COLUMNS[View.CARD])
  })

  test('initialView가 그림이면 그림 토글과 그림 그리드를 초기값으로 사용한다', () => {
    window.history.replaceState({}, '', '/library?view=img')

    const view = renderWithTestQueryClient(<AllLibraryMangaView initialView={View.IMAGE} />, {
      wrapper: createTestNavigationWrapper({
        pathname: '/library',
        searchParams: new URLSearchParams(window.location.search),
      }),
    })

    const card = view.container.querySelector('[data-manga-card]')
    const list = view.container.querySelector('ul')

    expect(view.getByRole('radio', { name: '그림' }).getAttribute('aria-checked')).toBe('true')
    expect(card).toBeTruthy()
    expect(card?.className).not.toContain('flex-col')
    expect(view.queryByText('Manga 101')).toBeNull()
    expect(list?.className).toContain(MANGA_LIST_GRID_COLUMNS[View.IMAGE])
  })
})
