import { type FetchRoute, installMockFetch, jsonResponse } from '@test/utils/fetch'
import { renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { type ReactElement, type ReactNode, useLayoutEffect } from 'react'

import type { GETV1BookmarkResponse } from '@/backend/api/v1/bookmark/GET'

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

const { default: BookmarkPageClient } = await import('./BookmarkPageClient')

beforeEach(() => {
  fetchRoutes = []
  fetchController = installMockFetch(() => fetchRoutes)
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
  test('북마크가 비어 있으면 빈 상태를 렌더링한다', () => {
    const view = renderWithLibrarySelection(<BookmarkPageClient initialData={{ bookmarks: [], nextCursor: null }} />)

    expect(view.getByText('북마크가 비어 있어요')).toBeTruthy()
  })

  test('선택 모드에서는 선택 가능한 카드 컴포넌트를 렌더링한다', () => {
    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/proxy/manga/101',
      response: () => jsonResponse({ id: 101, title: 'Bookmark 101', images: [] }),
    })

    const view = renderWithLibrarySelection(
      <BookmarkPageClient initialData={{ bookmarks: [{ mangaId: 101, createdAt: Date.now() }], nextCursor: null }} />,
      true,
    )

    expect(view.getByText('selectable-card')).toBeTruthy()
  })
})
