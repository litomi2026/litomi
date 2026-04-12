import '@test/setup.dom'
import { clearDocumentCookies, setAuthHintCookie } from '@test/utils/auth'
import { type FetchRoute, installMockFetch, jsonResponse } from '@test/utils/fetch'
import { renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup, fireEvent, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

const toastInfoMock = mock(() => {})
const toastSuccessMock = mock(() => {})
const showLoginRequiredToastMock = mock(() => {})

mock.module('sonner', () => ({
  toast: {
    info: toastInfoMock,
    success: toastSuccessMock,
  },
}))

mock.module('@/lib/toast', () => ({
  showLoginRequiredToast: showLoginRequiredToastMock,
}))

const { default: PostDetailLikeButton } = await import('./PostDetailLikeButton')

let fetchRoutes: FetchRoute[] = []
let fetchController: ReturnType<typeof installMockFetch>

beforeEach(() => {
  clearDocumentCookies()
  fetchRoutes = []
  fetchController = installMockFetch(() => fetchRoutes)
})

afterEach(() => {
  fetchController.restore()
  cleanup()
  clearDocumentCookies()
  toastInfoMock.mockClear()
  toastSuccessMock.mockClear()
  showLoginRequiredToastMock.mockClear()
})

afterAll(() => {
  mock.restore()
})

function mockAuthenticatedRequests({ likedPostIds = [] }: { likedPostIds?: number[] } = {}) {
  setAuthHintCookie()

  fetchRoutes.push(
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
          settings: {
            historySyncEnabled: true,
            adultVerifiedAdVisible: false,
            autoDeletionDay: 180,
          },
        }),
    },
    {
      matcher: ({ url }) => url.pathname === '/api/v1/post/liked',
      response: () => jsonResponse({ postIds: likedPostIds }),
    },
  )
}

describe('PostDetailLikeButton', () => {
  test('로그인한 사용자가 좋아요하면 PUT 요청과 낙관적 업데이트가 동작한다', async () => {
    mockAuthenticatedRequests()
    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/post/10/like',
      method: 'PUT',
      response: () => jsonResponse({ liked: true }, { status: 201 }),
    })

    const view = renderWithTestQueryClient(<PostDetailLikeButton likeCount={5} postId={10} />)

    await waitFor(() => {
      expect(fetchController.calls.some((call) => call.url.pathname === '/api/v1/post/liked')).toBe(true)
    })

    const likeButton = view.getByRole('button', { name: '좋아요' })
    fireEvent.click(likeButton)

    await waitFor(() => {
      expect(
        fetchController.calls.some((call) => call.method === 'PUT' && call.url.pathname === '/api/v1/post/10/like'),
      ).toBe(true)
      expect(likeButton.getAttribute('aria-pressed')).toBe('true')
      expect(view.getByText('6')).toBeTruthy()
    })
  })

  test('좋아요 요청이 실패하면 낙관적 업데이트를 롤백한다', async () => {
    let resolveLikeResponse: ((response: Response) => void) | undefined

    mockAuthenticatedRequests()
    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/post/10/like',
      method: 'PUT',
      response: () =>
        new Promise<Response>((resolve) => {
          resolveLikeResponse = resolve
        }),
    })

    const view = renderWithTestQueryClient(<PostDetailLikeButton likeCount={5} postId={10} />)

    await waitFor(() => {
      expect(fetchController.calls.some((call) => call.url.pathname === '/api/v1/post/liked')).toBe(true)
    })

    const likeButton = view.getByRole('button', { name: '좋아요' })
    fireEvent.click(likeButton)

    await waitFor(() => {
      expect(likeButton.getAttribute('aria-pressed')).toBe('true')
      expect(view.getByText('6')).toBeTruthy()
    })

    resolveLikeResponse?.(
      jsonResponse(
        {
          detail: '좋아요를 처리하지 못했어요',
          status: 500,
          title: 'Internal Server Error',
          type: 'about:blank',
        },
        { status: 500 },
      ),
    )

    await waitFor(() => {
      expect(likeButton.getAttribute('aria-pressed')).toBe('false')
      expect(view.getByText('5')).toBeTruthy()
    })
  })

  test('로그인하지 않은 사용자가 누르면 로그인 토스트를 보여준다', async () => {
    const view = renderWithTestQueryClient(<PostDetailLikeButton likeCount={5} postId={10} />)

    fireEvent.click(view.getByRole('button', { name: '좋아요' }))

    expect(showLoginRequiredToastMock).toHaveBeenCalledTimes(1)
    expect(fetchController.calls.some((call) => call.url.pathname === '/api/v1/post/10/like')).toBe(false)
  })
})
