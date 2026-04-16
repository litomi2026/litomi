import '@test/setup.dom'
import type { ReactNode } from 'react'

import { createTestNavigationWrapper } from '@test/utils/navigation'
import { renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, describe, expect, mock, test } from 'bun:test'

import { LibrarySelectionProvider } from './librarySelection'

mock.module('../AutoHideNavigation', () => ({
  default: () => null,
}))

mock.module('./[id]/ShareLibraryButton', () => ({
  default: () => null,
}))

mock.module('./LibraryManagementMenu', () => ({
  default: () => null,
}))

mock.module('./LibrarySidebar', () => ({
  default: () => null,
}))

mock.module('./PinLibraryButton', () => ({
  default: () => null,
}))

mock.module('./bookmark/useBulkDeleteBookmarkAction', () => ({
  default: () => null,
}))

mock.module('./history/useBulkDeleteReadingHistoryAction', () => ({
  default: () => null,
}))

mock.module('./rating/useBulkDeleteRatingAction', () => ({
  default: () => null,
}))

mock.module('./useBulkCopyToLibraryAction', () => ({
  default: () => null,
}))

mock.module('./useBulkMoveToLibraryAction', () => ({
  default: () => null,
}))

mock.module('./useBulkRemoveFromLibraryAction', () => ({
  default: () => null,
}))

mock.module('./useCurrentLibraryMeta', () => ({
  default: () => ({
    currentLibrary: null,
    libraryId: undefined,
  }),
}))

mock.module('@/components/card/MangaImportButton', () => ({
  default: () => null,
}))

mock.module('@/components/card/MangaImportModal', () => ({
  default: () => null,
}))

const { default: LibraryHeader } = await import('./LibraryHeader')
const { useBookmarkImportModalStore: useBookmarkBulkAddModalStore } =
  await import('./bookmark/BookmarkImportButton/store')

afterEach(() => {
  cleanup()
  useBookmarkBulkAddModalStore.setState({ isOpen: false })
})

afterAll(() => {
  mock.restore()
})

function renderHeader(pathname: string) {
  const NavigationWrapper = createTestNavigationWrapper({ pathname })

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <NavigationWrapper>
        <LibrarySelectionProvider scopeKey={pathname}>{children}</LibrarySelectionProvider>
      </NavigationWrapper>
    )
  }

  return renderWithTestQueryClient(
    <LibraryHeader
      libraries={[]}
      pinnedLibraries={[]}
      summary={{ bookmarkCount: 1, historyCount: 1, ratingCount: 1 }}
      userId={1}
    />,
    { wrapper: Wrapper },
  )
}

describe('LibraryHeader', () => {
  test('북마크 페이지에서는 헤더에 ID 추가 버튼을 렌더링하고 modal을 연다', async () => {
    const user = userEvent.setup()
    const view = renderHeader('/library/bookmark')

    await user.click(view.getByRole('button', { name: 'ID로 추가' }))

    expect(view.getByRole('dialog', { name: '작품 가져오기' })).toBeTruthy()
  })

  test('다른 컬렉션 페이지에서는 헤더에 ID 추가 버튼을 렌더링하지 않는다', () => {
    const view = renderHeader('/library/rating')

    expect(view.queryByRole('button', { name: 'ID로 추가' })).toBeNull()
  })
})
