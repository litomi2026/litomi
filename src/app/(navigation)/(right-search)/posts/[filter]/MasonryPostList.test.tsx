import '@test/setup.dom'
import { type FetchRoute, installMockFetch, jsonResponse } from '@test/utils/fetch'
import { renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

import { PostFilter } from '@/backend/api/v1/post/constant'

import MasonryPostList from './MasonryPostList'

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

describe('MasonryPostList', () => {
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

    const view = renderWithTestQueryClient(
      <MasonryPostList filter={PostFilter.FOLLOWING} NotFound={<div>empty</div>} showMangaCover={false} />,
    )

    await waitFor(() => {
      expect(view.getByText('팔로잉 탭은 로그인이 필요해요')).toBeTruthy()
    })
  })
})
