import { type FetchRoute, installMockFetch } from '@test/utils/fetch'
import { renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { type ReactElement, type ReactNode, useLayoutEffect } from 'react'

import type { GETV1ReadingHistoryResponse } from '@/backend/api/v1/library/history/GET'

import { LibrarySelectionProvider, useLibrarySelection } from '../librarySelection'

let fetchRoutes: FetchRoute[] = []
let fetchController: ReturnType<typeof installMockFetch>

const { default: HistoryPageClient } = await import('./HistoryPageClient')

beforeEach(() => {
  fetchRoutes = []
  fetchController = installMockFetch(() => fetchRoutes)
})

function renderWithLibrarySelection(ui: ReactElement, selectionMode = false) {
  return renderWithTestQueryClient(
    <LibrarySelectionProvider scopeKey="history-test">
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

afterAll(() => {
  mock.restore()
})

describe('HistoryPageClient', () => {
  test('감상 기록이 비어 있으면 빈 상태를 렌더링한다', () => {
    const view = renderWithLibrarySelection(<HistoryPageClient initialData={{ items: [], nextCursor: null }} />)

    expect(view.getByText('아직 읽은 작품이 없어요')).toBeTruthy()
  })

  test('다음 페이지가 남아 있으면 빈 상태를 바로 렌더링하지 않는다', () => {
    const view = renderWithLibrarySelection(<HistoryPageClient initialData={{ items: [], nextCursor: 'next-cursor' }} />)

    expect(view.queryByText('아직 읽은 작품이 없어요')).toBeNull()
  })
})
