import '@test/setup.dom'
import type { ReactNode } from 'react'

import { clearDocumentCookies, setAuthHintCookie } from '@test/utils/auth'
import { type FetchRoute, installMockFetch, jsonResponse } from '@test/utils/fetch'
import { renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup, fireEvent, waitFor } from '@testing-library/react'
import { afterAll, afterEach, beforeEach, describe, expect, mock, test } from 'bun:test'

const showLoginRequiredToastMock = mock(() => {})

mock.module('@/lib/toast', () => ({
  showLoginRequiredToast: showLoginRequiredToastMock,
}))

mock.module('@litomi/ui/dialog', () => ({
  default: ({ children, open }: { children: ReactNode; open: boolean }) => (open ? <div>{children}</div> : null),
}))

mock.module('@litomi/ui/dialog-body', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

mock.module('@litomi/ui/dialog-footer', () => ({
  default: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

mock.module('@litomi/ui/dialog-header', () => ({
  default: ({ title }: { title: string }) => <div>{title}</div>,
}))

const { default: FollowButton } = await import('./FollowButton')

let fetchRoutes: FetchRoute[] = []
let fetchController: ReturnType<typeof installMockFetch>
let currentFollowingUserIds: number[] = []

beforeEach(() => {
  clearDocumentCookies()
  fetchRoutes = []
  currentFollowingUserIds = []
  fetchController = installMockFetch(() => fetchRoutes)
})

afterEach(() => {
  fetchController.restore()
  cleanup()
  clearDocumentCookies()
  showLoginRequiredToastMock.mockClear()
})

afterAll(() => {
  mock.restore()
})

function mockAuthenticatedRequests({ followingUserIds = [] }: { followingUserIds?: number[] } = {}) {
  setAuthHintCookie()
  currentFollowingUserIds = [...followingUserIds]

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
      matcher: ({ url }) => url.pathname === '/api/v1/me/following',
      response: () => jsonResponse({ userIds: currentFollowingUserIds }),
    },
  )
}

describe('FollowButton', () => {
  test('로그인하지 않은 사용자에게는 팔로우 버튼을 렌더링하지 않는다', async () => {
    const view = renderWithTestQueryClient(<FollowButton leader={{ id: 10, name: 'leader' }} />)

    expect(view.queryByRole('button', { name: '팔로우' })).toBeNull()
    expect(showLoginRequiredToastMock).not.toHaveBeenCalled()
    expect(fetchController.calls.some((call) => call.url.pathname === '/api/v1/user/10/follow')).toBe(false)
  })

  test('팔로우 상태를 아직 불러오지 못했으면 버튼을 렌더링하지 않는다', async () => {
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
        matcher: ({ url }) => url.pathname === '/api/v1/me/following',
        response: () => new Promise<Response>(() => {}),
      },
    )

    const view = renderWithTestQueryClient(<FollowButton leader={{ id: 10, name: 'leader' }} />)

    await waitFor(() => {
      expect(fetchController.calls.some((call) => call.url.pathname === '/api/v1/me/following')).toBe(true)
    })

    expect(view.queryByRole('button', { name: '팔로우 상태 불러오는 중' })).toBeNull()
    expect(view.queryByRole('button', { name: '팔로우' })).toBeNull()
  })

  test('로그인한 사용자가 팔로우하면 PUT 요청과 버튼 상태 갱신이 동작한다', async () => {
    mockAuthenticatedRequests()
    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/user/10/follow',
      method: 'PUT',
      response: () => {
        currentFollowingUserIds = [10]
        return jsonResponse({ following: true }, { status: 201 })
      },
    })

    const view = renderWithTestQueryClient(<FollowButton leader={{ id: 10, name: 'leader' }} />)

    await waitFor(() => {
      expect(fetchController.calls.some((call) => call.url.pathname === '/api/v1/me/following')).toBe(true)
    })

    const followingRequestCountBeforeClick = fetchController.calls.filter(
      (call) => call.url.pathname === '/api/v1/me/following',
    ).length

    await waitFor(() => {
      expect(view.getByRole('button', { name: '팔로우' })).toBeTruthy()
    })

    const followButton = view.getByRole('button', { name: '팔로우' })
    fireEvent.click(followButton)

    await waitFor(() => {
      expect(
        fetchController.calls.some((call) => call.method === 'PUT' && call.url.pathname === '/api/v1/user/10/follow'),
      ).toBe(true)
      expect(followButton.textContent).toBe('팔로잉')
      expect(followButton.getAttribute('aria-pressed')).toBe('true')
    })

    expect(fetchController.calls.filter((call) => call.url.pathname === '/api/v1/me/following')).toHaveLength(
      followingRequestCountBeforeClick,
    )
  })

  test('이미 팔로우 중이면 언팔로우 다이얼로그를 거쳐 DELETE 요청을 보낸다', async () => {
    mockAuthenticatedRequests({ followingUserIds: [10] })
    fetchRoutes.push({
      matcher: ({ url }) => url.pathname === '/api/v1/user/10/follow',
      method: 'DELETE',
      response: () => {
        currentFollowingUserIds = []
        return new Response(null, { status: 204 })
      },
    })

    const view = renderWithTestQueryClient(<FollowButton leader={{ id: 10, name: 'leader' }} />)

    await waitFor(() => {
      expect(fetchController.calls.some((call) => call.url.pathname === '/api/v1/me/following')).toBe(true)
    })

    await waitFor(() => {
      expect(view.getByRole('button', { name: '팔로잉' })).toBeTruthy()
    })

    fireEvent.click(view.getByRole('button', { name: '팔로잉' }))
    fireEvent.submit(view.getByRole('button', { name: '언팔로우' }).closest('form')!)

    await waitFor(() => {
      expect(
        fetchController.calls.some(
          (call) => call.method === 'DELETE' && call.url.pathname === '/api/v1/user/10/follow',
        ),
      ).toBe(true)
      expect(view.getByRole('button', { name: '팔로우' }).getAttribute('aria-pressed')).toBe('false')
    })
  })
})
