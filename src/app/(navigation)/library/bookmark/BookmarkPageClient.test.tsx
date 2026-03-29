import { type FetchRoute, installMockFetch, jsonResponse } from '@test/utils/fetch'
import { renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { type ReactElement, type ReactNode, useLayoutEffect } from 'react'

import type { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark/GET'

import { CollectionItemSort } from '@/backend/api/v1/library/item-sort'

import { LibrarySelectionProvider, useLibrarySelection } from '../librarySelection'

mock.module('@/components/card/MangaCard', () => ({
  default: () => <div>manga-card</div>,
  MangaCardSkeleton: () => <div>manga-card-skeleton</div>,
}))

mock.module('../SelectableMangaCard', () => ({
  default: () => <div>selectable-card</div>,
}))

let fetchRoutes: FetchRoute[] = []
let fetchController: ReturnType<typeof installMockFetch>
const basePage: GETV1BookmarkResponse = {
  bookmarks: [{ mangaId: 101, createdAt: new Date('2025-01-01T00:00:00.000Z').getTime() }],
  nextCursor: null,
}

const { default: BookmarkPageClient } = await import('./BookmarkPageClient')

beforeEach(() => {
  fetchRoutes = [
    {
      matcher: ({ url }) => url.pathname === '/api/proxy/manga/101',
      response: () => jsonResponse({ id: 101, title: 'Bookmark 101', images: [] }),
    },
  ]
  fetchController = installMockFetch(() => fetchRoutes)
  window.history.replaceState({}, '', '/library/bookmark')
})

function renderWithLibrarySelection(ui: ReactElement, selectionMode = false) {
  return renderWithTestQueryClient(
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
  fetchController.restore()
  cleanup()
})

describe('BookmarkPageClient', () => {
  test('정렬 옵션을 렌더링한다', () => {
    const view = renderWithLibrarySelection(<BookmarkPageClient initialData={basePage} />)

    expect(view.getByRole('option', { name: '최근 추가순' })).toBeTruthy()
    expect(view.getByRole('option', { name: '오래된순' })).toBeTruthy()
    expect(view.getByRole('option', { name: '작품 ID 높은순' })).toBeTruthy()
    expect(view.getByRole('option', { name: '작품 ID 낮은순' })).toBeTruthy()
  })

  test('정렬을 변경하면 새 쿼리로 재조회하고 URL을 갱신한다', async () => {
    fetchRoutes.push({
      matcher: ({ url }) =>
        url.pathname === '/api/v1/bookmark' && url.searchParams.get('sort') === CollectionItemSort.MANGA_ID_ASC,
      response: () => jsonResponse(basePage),
    })

    const view = renderWithLibrarySelection(
      <BookmarkPageClient initialData={basePage} initialSort={CollectionItemSort.CREATED_DESC} />,
    )

    fireEvent.change(view.getByRole('combobox'), {
      target: { value: CollectionItemSort.MANGA_ID_ASC },
    })

    expect(view.getByText('manga-card-skeleton')).toBeTruthy()
    expect(window.location.search).toBe(`?sort=${CollectionItemSort.MANGA_ID_ASC}`)

    await waitFor(() => {
      expect(view.getByText('manga-card')).toBeTruthy()
    })

    const bookmarkRequests = fetchController.calls.filter(({ url }) => url.pathname === '/api/v1/bookmark')
    expect(bookmarkRequests).toHaveLength(1)
    expect(bookmarkRequests[0]?.url.searchParams.get('sort')).toBe(CollectionItemSort.MANGA_ID_ASC)
  })

  test('북마크가 비어 있으면 빈 상태를 렌더링한다', () => {
    const view = renderWithLibrarySelection(<BookmarkPageClient initialData={{ bookmarks: [], nextCursor: null }} />)

    expect(view.getByText('북마크가 비어 있어요')).toBeTruthy()
  })

  test('선택 모드에서는 선택 가능한 카드 컴포넌트를 렌더링한다', () => {
    const view = renderWithLibrarySelection(
      <BookmarkPageClient initialData={{ bookmarks: [{ mangaId: 101, createdAt: Date.now() }], nextCursor: null }} />,
      true,
    )

    expect(view.getByText('selectable-card')).toBeTruthy()
  })
})
