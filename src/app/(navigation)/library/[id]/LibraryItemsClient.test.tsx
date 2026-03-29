import { type FetchRoute, installMockFetch, jsonResponse } from '@test/utils/fetch'
import { renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { type ReactElement, type ReactNode, useLayoutEffect } from 'react'

import type { GETLibraryItemsResponse } from '@/backend/api/v1/library/[id]/item/GET'

import { CollectionItemSort } from '@/backend/api/v1/library/item-sort'

import { LibrarySelectionProvider, useLibrarySelection } from '../librarySelection'

mock.module('@/components/card/MangaCard', () => ({
  default: () => <div>manga-card</div>,
  MangaCardSkeleton: () => <div>manga-card-skeleton</div>,
}))

mock.module('../SelectableMangaCard', () => ({
  default: () => <div>selectable-card</div>,
}))

const { default: LibraryItemsClient } = await import('./LibraryItemsClient')

let fetchRoutes: FetchRoute[] = []
let fetchController: ReturnType<typeof installMockFetch>

const basePage: GETLibraryItemsResponse = {
  items: [{ mangaId: 101, createdAt: new Date('2025-01-01T00:00:00.000Z').getTime() }],
  nextCursor: null,
}

beforeEach(() => {
  fetchRoutes = [
    {
      matcher: ({ url }) => url.pathname === '/api/proxy/manga/101',
      response: () => jsonResponse({ id: 101, title: 'Library 101', images: [] }),
    },
  ]
  fetchController = installMockFetch(fetchRoutes)
  window.history.replaceState({}, '', '/library/1')
})

function renderWithLibrarySelection(ui: ReactElement, selectionMode = false) {
  return renderWithTestQueryClient(
    <LibrarySelectionProvider scopeKey="library-item-test">
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
  fetchController.restore()
})

describe('LibraryItemsClient', () => {
  test('소유자에게는 정렬 옵션을 렌더링한다', () => {
    const view = renderWithLibrarySelection(
      <LibraryItemsClient
        initialItems={basePage}
        initialSort={CollectionItemSort.CREATED_DESC}
        isOwner
        library={{ id: 1, name: '테스트', isPublic: true }}
      />,
    )

    expect(view.getByRole('option', { name: '최근 추가순' })).toBeTruthy()
    expect(view.getByRole('option', { name: '오래된순' })).toBeTruthy()
    expect(view.getByRole('option', { name: '작품 ID 높은순' })).toBeTruthy()
    expect(view.getByRole('option', { name: '작품 ID 낮은순' })).toBeTruthy()
  })

  test('소유자가 정렬을 변경하면 scope=me 요청으로 재조회하고 URL을 갱신한다', async () => {
    fetchRoutes.push({
      matcher: ({ url }) =>
        url.pathname === '/api/v1/library/1/item' &&
        url.searchParams.get('scope') === 'me' &&
        url.searchParams.get('sort') === CollectionItemSort.MANGA_ID_ASC,
      response: () => jsonResponse(basePage),
    })

    const view = renderWithLibrarySelection(
      <LibraryItemsClient
        initialItems={basePage}
        initialSort={CollectionItemSort.CREATED_DESC}
        isOwner
        library={{ id: 1, name: '테스트', isPublic: true }}
      />,
    )

    fireEvent.change(view.getByRole('combobox'), {
      target: { value: CollectionItemSort.MANGA_ID_ASC },
    })

    expect(view.getByText('manga-card-skeleton')).toBeTruthy()
    expect(window.location.search).toBe(`?sort=${CollectionItemSort.MANGA_ID_ASC}`)

    await waitFor(() => {
      expect(view.getByText('manga-card')).toBeTruthy()
    })

    const requests = fetchController.calls.filter(({ url }) => url.pathname === '/api/v1/library/1/item')
    expect(requests).toHaveLength(1)
    expect(requests[0]?.url.searchParams.get('scope')).toBe('me')
    expect(requests[0]?.url.searchParams.get('sort')).toBe(CollectionItemSort.MANGA_ID_ASC)
  })

  test('공개 서재 방문자에게는 정렬 UI를 노출하지 않는다', () => {
    const view = renderWithLibrarySelection(
      <LibraryItemsClient
        initialItems={basePage}
        initialSort={CollectionItemSort.CREATED_DESC}
        isOwner={false}
        library={{ id: 1, name: '테스트', isPublic: true }}
      />,
    )

    expect(view.queryByRole('combobox')).toBeNull()
  })
})
