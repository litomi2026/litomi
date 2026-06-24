import '@test/setup.dom'
import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { clearDocumentCookies, setAuthHintCookie } from '@test/utils/auth'
import { type FetchRoute, installMockFetch, jsonResponse } from '@test/utils/fetch'
import { createTestNavigationWrapper } from '@test/utils/navigation'
import { renderWithTestQueryClient } from '@test/utils/query-client'
import { cleanup, fireEvent } from '@testing-library/react'

let fetchRoutes: FetchRoute[] = []
let fetchController: ReturnType<typeof installMockFetch>

const { default: PostCreationForm } = await import('../PostCreationForm')

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
          loginId: 'writer',
          name: 'writer',
          nickname: 'Writer',
          adultVerification: { required: false, status: 'adult' },
          settings: {
            historySyncEnabled: true,
            adultVerifiedAdVisible: false,
            autoDeletionDay: 180,
          },
        }),
    },
  ]

  fetchController = installMockFetch(() => fetchRoutes)
})

afterEach(() => {
  fetchController.restore()
  cleanup()
  clearDocumentCookies()
})

describe('PostCreationForm', () => {
  test('포커스 이후 children으로 전달한 답글 안내 문구를 보여준다', async () => {
    const view = renderWithTestQueryClient(
      <PostCreationForm parentPostId={10} placeholder="답글 게시하기">
        <p>
          <span>@lozyreview </span>에게 보내는 답글
        </p>
      </PostCreationForm>,
      { wrapper: createTestNavigationWrapper() },
    )

    const textarea = await view.findByPlaceholderText('답글 게시하기')
    fireEvent.focus(textarea)

    expect(await view.findByText((_, node) => node?.textContent === '@lozyreview 에게 보내는 답글')).toBeTruthy()
    expect(view.queryByText((_, node) => node?.textContent === '@writer 에게 보내는 답글')).toBeNull()
  })
})
