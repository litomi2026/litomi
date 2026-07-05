import { describe, expect, test } from 'bun:test'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { seedBookmarks, seedUser } from '@test/backend/setup/db'
import { expectInvalidParams, expectProblemResponse } from '@test/backend/setup/problem'

import { createBookmarkAuthContext, listBookmarksForUser } from '../fixtures'

installBackendIntegrationHooks()

describe('DELETE /api/v1/bookmark/:id', () => {
  test('현재 사용자의 북마크를 삭제하고 204를 반환한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()
    const otherUser = await seedUser()
    await seedBookmarks(user.id, [{ mangaId: 101 }, { mangaId: 102 }])
    await seedBookmarks(otherUser.id, [{ mangaId: 101 }])

    const response = await requestBackend({
      path: '/api/v1/bookmark/101',
      method: 'DELETE',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(204)
    expect((await listBookmarksForUser(user.id)).map(({ mangaId }) => mangaId)).toEqual([102])
    expect((await listBookmarksForUser(otherUser.id)).map(({ mangaId }) => mangaId)).toEqual([101])
  })

  test('없는 북마크여도 204를 반환한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()
    await seedBookmarks(user.id, [{ mangaId: 102 }])

    const response = await requestBackend({
      path: '/api/v1/bookmark/999',
      method: 'DELETE',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(204)
    expect((await listBookmarksForUser(user.id)).map(({ mangaId }) => mangaId)).toEqual([102])
  })

  test('유효하지 않은 id면 400 invalid-input을 반환하고 아무것도 삭제하지 않는다', async () => {
    const { auth, user } = await createBookmarkAuthContext()
    await seedBookmarks(user.id, [{ mangaId: 101 }, { mangaId: 102 }])

    const response = await requestBackend({
      path: '/api/v1/bookmark/0',
      method: 'DELETE',
      cookies: auth.cookieHeader,
    })

    const problem = await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      title: '입력을 확인해 주세요',
      instance: '/api/v1/bookmark/0',
    })

    expectInvalidParams(problem, [{ name: 'id' }])
    expect((await listBookmarksForUser(user.id)).map(({ mangaId }) => mangaId)).toEqual([101, 102])
  })
})
