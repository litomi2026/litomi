import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { seedBookmarks, seedUser } from '@test/backend/setup/db'
import { describe, expect, test } from 'bun:test'

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
})
