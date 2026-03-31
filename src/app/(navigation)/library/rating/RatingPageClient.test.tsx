import { type FetchRoute, installMockFetch, jsonResponse } from '@test/utils/fetch'
import { createTestNavigationWrapper } from '@test/utils/navigation'
import { renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { type ReactElement, type ReactNode, useLayoutEffect } from 'react'

import type { GETV1RatingsResponse } from '@/backend/api/v1/library/rating/GET'

import { isGroupedRatingSort, RatingSort } from '@/backend/api/v1/library/enum'
import { View } from '@/utils/param'

import { fireEvent } from '../../../../../test/utils/render'
import { LibrarySelectionProvider, useLibrarySelection } from '../librarySelection'

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

mock.module('@/components/card/MangaCard', () => ({
  default: ({ variant = 'card' }: { variant?: string }) => <div>{`manga-card-${variant}`}</div>,
  MangaCardSkeleton: ({ variant = 'card' }: { variant?: string }) => <div>{`manga-card-skeleton-${variant}`}</div>,
}))

mock.module('../CensoredManga', () => ({
  default: () => null,
}))

mock.module('../SelectableMangaCard', () => ({
  default: ({ variant = 'card' }: { variant?: string }) => <div>{`selectable-card-${variant}`}</div>,
}))

let fetchRoutes: FetchRoute[] = []
let fetchController: ReturnType<typeof installMockFetch>

const { default: RatingPageClient } = await import('./RatingPageClient')

beforeEach(() => {
  fetchRoutes = [
    {
      matcher: ({ url }) => url.pathname.startsWith('/api/proxy/manga/'),
      response: ({ url }) => {
        const mangaId = Number(url.pathname.split('/').pop())

        return jsonResponse({
          id: mangaId,
          title: `Manga ${mangaId}`,
          images: [],
        })
      },
    },
  ]
  fetchController = installMockFetch(() => fetchRoutes)
  window.history.replaceState({}, '', '/library/rating')
})

function renderWithLibrarySelection(ui: ReactElement, selectionMode = false) {
  return renderWithTestQueryClient(
    <LibrarySelectionProvider scopeKey="rating-test">
      <SelectionModeController selectionMode={selectionMode}>{ui}</SelectionModeController>
    </LibrarySelectionProvider>,
    { wrapper: createTestNavigationWrapper() },
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
  fetchController.restore()
  cleanup()
})

afterAll(() => {
  mock.restore()
})

describe('RatingPageClient', () => {
  test('작품 ID 정렬 옵션을 렌더링한다', () => {
    const view = renderWithLibrarySelection(
      <RatingPageClient initialData={basePage} initialSort={RatingSort.UPDATED_DESC} initialView={View.CARD} />,
    )

    expect(view.getByRole('option', { name: '작품 ID 높은순' })).toBeTruthy()
    expect(view.getByRole('option', { name: '작품 ID 낮은순' })).toBeTruthy()
  })

  test('평점 정렬만 그룹 렌더링 대상으로 판단한다', () => {
    expect(isGroupedRatingSort(RatingSort.RATING_DESC)).toBe(true)
    expect(isGroupedRatingSort(RatingSort.RATING_ASC)).toBe(true)
    expect(isGroupedRatingSort(RatingSort.MANGA_ID_ASC)).toBe(false)
  })

  test('작품 ID 정렬로 바꾸면 새 쿼리에는 초기 서버 데이터를 재사용하지 않는다', async () => {
    const pendingResponse = new Promise<Response>(() => {})

    fetchRoutes.push({
      matcher: ({ url }) =>
        url.pathname === '/api/v1/library/rating' && url.searchParams.get('sort') === RatingSort.MANGA_ID_ASC,
      response: () => pendingResponse,
    })

    const view = renderWithLibrarySelection(
      <RatingPageClient initialData={basePage} initialSort={RatingSort.UPDATED_DESC} initialView={View.CARD} />,
      true,
    )

    expect(view.getByText('selectable-card-card')).toBeTruthy()

    fireEvent.change(view.getByRole('combobox'), {
      target: { value: RatingSort.MANGA_ID_ASC },
    })

    expect(view.queryByText('selectable-card-card')).toBeNull()
    expect(window.location.search).toBe(`?sort=${RatingSort.MANGA_ID_ASC}`)
    expect(view.getByText('manga-card-skeleton-card')).toBeTruthy()

    await waitFor(() => {
      const ratingRequests = fetchController.calls
        .map(({ url }) => url)
        .filter((url) => url.pathname === '/api/v1/library/rating')

      expect(ratingRequests).toHaveLength(1)
      expect(ratingRequests[0]?.searchParams.get('sort')).toBe(RatingSort.MANGA_ID_ASC)
    })
  })

  test('작품 ID 정렬에서는 평점 그룹 헤더를 렌더링하지 않는다', () => {
    const view = renderWithLibrarySelection(
      <RatingPageClient initialData={basePage} initialSort={RatingSort.MANGA_ID_ASC} initialView={View.CARD} />,
    )

    expect(view.queryByText('(4점)')).toBeNull()
  })

  test('정렬을 변경해 새 데이터가 아직 없어도 스켈레톤을 렌더링하며 크래시하지 않는다', async () => {
    let resolveResponse!: (response: Response) => void
    const pendingResponse = new Promise<Response>((resolve) => {
      resolveResponse = resolve
    })

    fetchRoutes.push({
      matcher: ({ url }) =>
        url.pathname === '/api/v1/library/rating' && url.searchParams.get('sort') === RatingSort.MANGA_ID_ASC,
      response: () => pendingResponse,
    })

    const view = renderWithLibrarySelection(
      <RatingPageClient initialData={basePage} initialSort={RatingSort.UPDATED_DESC} initialView={View.CARD} />,
    )

    fireEvent.change(view.getByRole('combobox'), {
      target: { value: RatingSort.MANGA_ID_ASC },
    })

    expect(view.getByText('manga-card-skeleton-card')).toBeTruthy()

    resolveResponse(jsonResponse(basePage))

    await waitFor(
      () => {
        expect(view.getByText('manga-card-card')).toBeTruthy()
      },
      { timeout: 5000 },
    )
  })

  test('평점 정렬에서는 평점 그룹 헤더를 렌더링한다', () => {
    const view = renderWithLibrarySelection(
      <RatingPageClient initialData={basePage} initialSort={RatingSort.RATING_DESC} initialView={View.CARD} />,
    )

    expect(view.getByText('(4점)')).toBeTruthy()
  })

  test('평가가 비어 있으면 빈 상태를 렌더링한다', () => {
    const view = renderWithLibrarySelection(
      <RatingPageClient
        initialData={{ items: [], nextCursor: null }}
        initialSort={RatingSort.UPDATED_DESC}
        initialView={View.CARD}
      />,
    )

    expect(view.getByText('아직 평가한 작품이 없어요')).toBeTruthy()
  })

  test('정렬을 변경하면 view 쿼리를 유지한다', async () => {
    window.history.replaceState({}, '', '/library/rating?view=img')

    fetchRoutes.push({
      matcher: ({ url }) =>
        url.pathname === '/api/v1/library/rating' && url.searchParams.get('sort') === RatingSort.MANGA_ID_ASC,
      response: () => jsonResponse(basePage),
    })

    const view = renderWithLibrarySelection(
      <RatingPageClient initialData={basePage} initialSort={RatingSort.UPDATED_DESC} initialView={View.IMAGE} />,
    )

    fireEvent.change(view.getByRole('combobox'), {
      target: { value: RatingSort.MANGA_ID_ASC },
    })

    expect(new URLSearchParams(window.location.search).get('sort')).toBe(RatingSort.MANGA_ID_ASC)
    expect(new URLSearchParams(window.location.search).get('view')).toBe(View.IMAGE)

    await waitFor(() => {
      expect(view.getByText('manga-card-img')).toBeTruthy()
    })
  })

  test('initialView가 그림이면 image variant를 전달한다', () => {
    window.history.replaceState({}, '', '/library/rating?view=img')

    const view = renderWithLibrarySelection(
      <RatingPageClient initialData={basePage} initialSort={RatingSort.UPDATED_DESC} initialView={View.IMAGE} />,
    )

    expect(view.getByText('manga-card-img')).toBeTruthy()
  })

  test('선택 모드와 그림 보기에서도 image selectable variant를 전달한다', () => {
    window.history.replaceState({}, '', '/library/rating?view=img')

    const view = renderWithLibrarySelection(
      <RatingPageClient initialData={basePage} initialSort={RatingSort.UPDATED_DESC} initialView={View.IMAGE} />,
      true,
    )

    expect(view.getByText('selectable-card-img')).toBeTruthy()
  })
})
