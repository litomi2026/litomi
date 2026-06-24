import '@test/setup.dom'
import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'
import { PostFilter } from '@litomi/domain/post/filter'
import { type FetchRoute, installMockFetch, jsonResponse } from '@test/utils/fetch'
import { renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup, waitFor } from '@testing-library/react'

import PostList from './PostList'

let fetchRoutes: FetchRoute[] = []
let fetchController: ReturnType<typeof installMockFetch>

beforeEach(() => {
  fetchRoutes = []
  fetchController = installMockFetch(() => fetchRoutes)
})

afterEach(() => {
  fetchController.restore()
  cleanup()
})

afterAll(() => {
  mock.restore()
})

describe('PostList', () => {
  test('팔로잉 피드가 401을 반환하면 로그인 온보딩을 보여준다', async () => {
    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/post' && url.searchParams.get('filter') === PostFilter.FOLLOWING,
      response: () =>
        jsonResponse(
          {
            detail: '로그인 정보가 없거나 만료됐어요',
            status: 401,
            title: 'Unauthorized',
            type: 'about:blank',
          },
          { status: 401 },
        ),
    })

    const view = renderWithTestQueryClient(<PostList source={{ type: 'timeline', filter: PostFilter.FOLLOWING }} />)

    await waitFor(() => {
      expect(view.getByText('팔로잉 탭은 로그인이 필요해요')).toBeTruthy()
    })
  })

  test('일반 오류가 발생하면 오류 상태와 재시도 버튼을 보여준다', async () => {
    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/post' && url.searchParams.get('filter') === PostFilter.RECOMMEND,
      response: () =>
        jsonResponse(
          {
            detail: '서버 오류가 발생했어요',
            status: 500,
            title: 'Internal Server Error',
            type: 'about:blank',
          },
          { status: 500 },
        ),
    })

    const view = renderWithTestQueryClient(<PostList source={{ type: 'timeline', filter: PostFilter.RECOMMEND }} />)

    await waitFor(() => {
      expect(view.getByText('글을 불러올 수 없어요')).toBeTruthy()
    })

    expect(view.getByLabelText('error icon')).toBeTruthy()
    expect(view.getByText('다시 시도')).toBeTruthy()
  })
})
