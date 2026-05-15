import '@test/setup.dom'
import { type FetchRoute, installMockFetch, jsonResponse } from '@test/utils/fetch'
import { createTestQueryClient, renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

import { QueryKeys } from '@/lib/react-query/query-keys'

const toastSuccessMock = mock(() => {})
const toastWarningMock = mock(() => {})

mock.module('sonner', () => ({
  toast: {
    success: toastSuccessMock,
    warning: toastWarningMock,
  },
}))

const { default: BookmarkBulkAddButton } = await import('./index')
const { default: BookmarkBulkAddModal } = await import('./BookmarkImportModal')
const { useBookmarkImportModalStore: useBookmarkBulkAddModalStore } = await import('./store')

let fetchRoutes: FetchRoute[] = []
let fetchController: ReturnType<typeof installMockFetch>
let postResponse = {
  createdMangaIds: [101, 102],
  duplicateCount: 1,
  overflowCount: 1,
}

function TestHarness() {
  return (
    <>
      <BookmarkBulkAddButton />
      <BookmarkBulkAddModal />
    </>
  )
}

beforeEach(() => {
  postResponse = {
    createdMangaIds: [101, 102],
    duplicateCount: 1,
    overflowCount: 1,
  }

  fetchRoutes = [
    {
      matcher: ({ method, url }) => method === 'POST' && url.pathname === '/api/v1/bookmark',
      response: () => jsonResponse(postResponse),
    },
  ]

  fetchController = installMockFetch(() => fetchRoutes)
  useBookmarkBulkAddModalStore.setState({ isOpen: false })
})

afterEach(() => {
  fetchController.restore()
  cleanup()
  toastSuccessMock.mockClear()
  toastWarningMock.mockClear()
  useBookmarkBulkAddModalStore.setState({ isOpen: false })
})

afterAll(() => {
  mock.restore()
})

describe('BookmarkBulkAddButton', () => {
  test('입력된 작품 ID가 없거나 100개를 넘으면 제출을 막는다', async () => {
    const user = userEvent.setup()
    const view = renderWithTestQueryClient(<TestHarness />)

    fireEvent.click(view.getByRole('button', { name: 'ID로 추가' }))

    expect((view.getByRole('button', { name: '가져오기' }) as HTMLButtonElement).disabled).toBe(true)

    await user.type(
      view.getByLabelText('작품 ID 입력'),
      Array.from({ length: 101 }, (_, index) => index + 1).join('\n'),
    )

    await waitFor(() => {
      expect(view.getByRole('button', { name: '101개 가져오기' })).toBeTruthy()
    })

    expect((view.getByRole('button', { name: '101개 가져오기' }) as HTMLButtonElement).disabled).toBe(true)
  })

  test('부분 성공 시 success toast를 띄우고 북마크 관련 쿼리를 무효화한 뒤 닫는다', async () => {
    const user = userEvent.setup()
    const queryClient = createTestQueryClient()
    const originalInvalidateQueries = queryClient.invalidateQueries.bind(queryClient)
    const invalidateQueriesMock = mock((...args: Parameters<typeof queryClient.invalidateQueries>) =>
      originalInvalidateQueries(...args),
    )

    queryClient.invalidateQueries = invalidateQueriesMock as typeof queryClient.invalidateQueries

    const view = renderWithTestQueryClient(<TestHarness />, { queryClient })

    fireEvent.click(view.getByRole('button', { name: 'ID로 추가' }))
    await user.type(view.getByLabelText('작품 ID 입력'), '101\n102\n103\n104\n101')

    await waitFor(() => {
      expect(view.getByRole('button', { name: '4개 가져오기' })).toBeTruthy()
    })

    fireEvent.click(view.getByRole('button', { name: '4개 가져오기' }))

    await waitFor(() => {
      expect(toastSuccessMock).toHaveBeenCalledWith('2개 작품을 북마크했어요 (중복 1개, 한도 초과 1개)')
    })

    const postCall = fetchController.calls.find(
      ({ method, url }) => method === 'POST' && url.pathname === '/api/v1/bookmark',
    )
    expect(postCall).toBeTruthy()
    expect(JSON.parse(String(postCall?.init?.body))).toEqual({ mangaIds: [101, 102, 103, 104] })

    expect(invalidateQueriesMock).toHaveBeenCalledTimes(3)

    const invalidatedQueryKeys = invalidateQueriesMock.mock.calls.map(([options]) => JSON.stringify(options?.queryKey))
    expect(invalidatedQueryKeys).toContain(JSON.stringify(QueryKeys.bookmarks))
    expect(invalidatedQueryKeys).toContain(JSON.stringify(QueryKeys.infiniteBookmarksBase))
    expect(invalidatedQueryKeys).toContain(JSON.stringify(QueryKeys.librarySummaryBase))
    expect(useBookmarkBulkAddModalStore.getState().isOpen).toBe(false)
  })

  test('새로 추가된 북마크가 없으면 warning toast만 띄우고 modal을 유지한다', async () => {
    const user = userEvent.setup()
    postResponse = {
      createdMangaIds: [],
      duplicateCount: 2,
      overflowCount: 1,
    }

    const view = renderWithTestQueryClient(<TestHarness />)

    fireEvent.click(view.getByRole('button', { name: 'ID로 추가' }))
    await user.type(view.getByLabelText('작품 ID 입력'), '101\n102\n103')
    fireEvent.click(view.getByRole('button', { name: '3개 가져오기' }))

    await waitFor(() => {
      expect(toastWarningMock).toHaveBeenCalledWith('새로 추가된 북마크가 없어요 (중복 2개, 한도 초과 1개)')
    })

    expect(useBookmarkBulkAddModalStore.getState().isOpen).toBe(true)
  })

  test('에러가 발생하면 local toast 없이 modal을 유지한다', async () => {
    const user = userEvent.setup()

    fetchRoutes = [
      {
        matcher: ({ method, url }) => method === 'POST' && url.pathname === '/api/v1/bookmark',
        response: () =>
          jsonResponse(
            {
              type: 'https://localhost/problems/test',
              title: 'Error',
              status: 403,
              detail: '북마크를 추가할 수 없어요',
            },
            { status: 403 },
          ),
      },
    ]

    const view = renderWithTestQueryClient(<TestHarness />)

    fireEvent.click(view.getByRole('button', { name: 'ID로 추가' }))
    await user.type(view.getByLabelText('작품 ID 입력'), '101\n102')
    fireEvent.click(view.getByRole('button', { name: '2개 가져오기' }))

    await waitFor(() => {
      expect(
        fetchController.calls.some(({ method, url }) => method === 'POST' && url.pathname === '/api/v1/bookmark'),
      ).toBe(true)
    })

    expect(toastSuccessMock).not.toHaveBeenCalled()
    expect(toastWarningMock).not.toHaveBeenCalled()
    expect(useBookmarkBulkAddModalStore.getState().isOpen).toBe(true)
  })
})
