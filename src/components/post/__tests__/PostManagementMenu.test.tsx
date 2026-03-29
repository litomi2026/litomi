import '@test/setup.dom'
import { clearDocumentCookies, setAuthHintCookie } from '@test/utils/auth'
import { type FetchRoute, installMockFetch, jsonResponse } from '@test/utils/fetch'
import { renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup, fireEvent, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

const router = {
  back: mock(() => {}),
  replace: mock(() => {}),
}

mock.module('next/navigation', () => ({
  useRouter: () => router,
}))

let fetchRoutes: FetchRoute[] = []
let fetchController: ReturnType<typeof installMockFetch>

const { default: PostManagementMenu } = await import('../PostManagementMenu')

beforeEach(() => {
  clearDocumentCookies()
  setAuthHintCookie()

  fetchRoutes = [
    {
      matcher: ({ url }) => url.pathname === '/api/v1/me',
      response: () =>
        jsonResponse({
          id: 1,
          imageURL: null,
          loginId: 'user1',
          name: 'user1',
          nickname: 'User One',
          adultVerification: { required: false, status: 'adult' },
        }),
    },
  ]
  fetchController = installMockFetch(() => fetchRoutes)
})

afterEach(() => {
  fetchController.restore()
  cleanup()
  clearDocumentCookies()
  router.back.mockClear()
  router.replace.mockClear()
})

describe('PostManagementMenu', () => {
  test('작성자 본인일 때만 글 관리 버튼을 보여준다', async () => {
    const view = renderWithTestQueryClient(<PostManagementMenu authorId={1} postId={10} />)

    expect(await view.findByRole('button', { name: '글 관리' })).toBeTruthy()
  })

  test('작성자가 아니면 글 관리 버튼을 숨긴다', async () => {
    const view = renderWithTestQueryClient(<PostManagementMenu authorId={2} postId={10} />)

    await waitFor(() => {
      expect(fetchController.fetchMock).toHaveBeenCalledTimes(1)
      expect(view.queryByRole('button', { name: '글 관리' })).toBeNull()
    })
  })

  test('삭제 메뉴를 누르면 확인 다이얼로그를 연다', async () => {
    const view = renderWithTestQueryClient(<PostManagementMenu authorId={1} postId={10} />)

    fireEvent.click(await view.findByRole('button', { name: '글 관리' }))

    fireEvent.click(view.getByRole('button', { name: '글 삭제' }))

    expect(view.getByText('이 글을 삭제할까요?')).toBeTruthy()
  })
})
