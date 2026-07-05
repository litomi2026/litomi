import { describe, expect, test } from 'bun:test'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { seedBookmark, seedBookmarks, seedUser } from '@test/backend/setup/db'
import { expectInvalidParams, expectProblemResponse } from '@test/backend/setup/problem'

import { createBookmarkAuthContext, listBookmarksForUser } from './fixtures'

installBackendIntegrationHooks()

describe('DELETE /api/v1/bookmark', () => {
  test('mangaIds가 비어 있으면 400을 반환하고 아무것도 삭제하지 않는다', async () => {
    const { auth, user } = await createBookmarkAuthContext()
    await seedBookmark(user.id, { mangaId: 101 })

    const response = await requestBackend({
      path: '/api/v1/bookmark',
      method: 'DELETE',
      cookies: auth.cookieHeader,
      json: { mangaIds: [] },
    })

    const problem = await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      title: '입력을 확인해 주세요',
      instance: '/api/v1/bookmark',
    })

    expectInvalidParams(problem, [{ name: 'mangaIds' }])
    expect((await listBookmarksForUser(user.id)).map(({ mangaId }) => mangaId)).toEqual([101])
  })

  test('현재 사용자의 요청된 북마크만 한 번씩 삭제한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()
    const otherUser = await seedUser()
    await seedBookmarks(user.id, [{ mangaId: 100 }, { mangaId: 101 }, { mangaId: 102 }])
    await seedBookmarks(otherUser.id, [{ mangaId: 101 }, { mangaId: 103 }])

    const response = await requestBackend({
      path: '/api/v1/bookmark',
      method: 'DELETE',
      cookies: auth.cookieHeader,
      json: { mangaIds: [101, 101, 999] },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ deletedCount: 1 })
    expect((await listBookmarksForUser(user.id)).map(({ mangaId }) => mangaId)).toEqual([100, 102])
    expect((await listBookmarksForUser(otherUser.id)).map(({ mangaId }) => mangaId)).toEqual([101, 103])
  })

  test('매칭되는 북마크가 없어도 deletedCount 0을 반환한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()
    await seedBookmark(user.id, { mangaId: 100 })

    const response = await requestBackend({
      path: '/api/v1/bookmark',
      method: 'DELETE',
      cookies: auth.cookieHeader,
      json: { mangaIds: [999] },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ deletedCount: 0 })
    expect((await listBookmarksForUser(user.id)).map(({ mangaId }) => mangaId)).toEqual([100])
  })
})
