import '@test/setup.dom'

import type { ReactElement } from 'react'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render } from '@testing-library/react'
import { afterEach, describe, expect, mock, test } from 'bun:test'

const router = {
  back: mock(() => {}),
  replace: mock(() => {}),
}

const useMeQueryMock = mock(() => ({
  data: {
    id: 1,
    imageURL: null,
    loginId: 'user1',
    name: 'user1',
    nickname: 'User One',
    adultVerification: { required: false, status: 'adult' },
  },
}))

mock.module('next/navigation', () => ({
  useRouter: () => router,
}))

mock.module('@/query/useMeQuery', () => ({
  default: useMeQueryMock,
}))

const { default: PostManagementMenu } = await import('../PostManagementMenu')

function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

afterEach(() => {
  cleanup()
  router.back.mockClear()
  router.replace.mockClear()
  useMeQueryMock.mockClear()
})

describe('PostManagementMenu', () => {
  test('작성자 본인일 때만 글 관리 버튼을 보여준다', () => {
    const view = renderWithQueryClient(<PostManagementMenu authorId={1} postId={10} />)

    expect(view.getByRole('button', { name: '글 관리' })).toBeTruthy()
  })

  test('작성자가 아니면 글 관리 버튼을 숨긴다', () => {
    const view = renderWithQueryClient(<PostManagementMenu authorId={2} postId={10} />)

    expect(view.queryByRole('button', { name: '글 관리' })).toBeNull()
  })

  test('삭제 메뉴를 누르면 확인 다이얼로그를 연다', () => {
    const view = renderWithQueryClient(<PostManagementMenu authorId={1} postId={10} />)

    fireEvent.click(view.getByRole('button', { name: '글 관리' }))
    fireEvent.click(view.getByRole('button', { name: '글 삭제' }))

    expect(view.getByText('이 글을 삭제할까요?')).toBeTruthy()
  })
})
