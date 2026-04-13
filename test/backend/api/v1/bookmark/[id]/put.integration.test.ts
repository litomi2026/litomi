import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { seedBookmark, seedBookmarks } from '@test/backend/setup/db'
import { expectProblemResponse } from '@test/backend/setup/problem'
import { describe, expect, test } from 'bun:test'

import { createBookmarkAuthContext, listBookmarksForUser } from '../fixtures'

installBackendIntegrationHooks()

describe('PUT /api/v1/bookmark/:id', () => {
  test('새 북마크면 201과 생성 시각을 반환한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()

    const response = await requestBackend({
      path: '/api/v1/bookmark/123',
      method: 'PUT',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(201)

    const body = await response.json()
    expect(body.mangaId).toBe(123)
    expect(typeof body.createdAt).toBe('number')

    const bookmarks = await listBookmarksForUser(user.id)
    expect(bookmarks).toHaveLength(1)
    expect(bookmarks[0]?.mangaId).toBe(123)
    expect(bookmarks[0]?.createdAt.getTime()).toBe(body.createdAt)
  })

  test('이미 저장된 북마크면 기존 createdAt을 유지한 채 200을 반환한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()
    const createdAt = new Date('2025-01-01T00:00:00.000Z')
    await seedBookmark(user.id, { mangaId: 123, createdAt })

    const response = await requestBackend({
      path: '/api/v1/bookmark/123',
      method: 'PUT',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      mangaId: 123,
      createdAt: createdAt.getTime(),
    })

    const bookmarks = await listBookmarksForUser(user.id)
    expect(bookmarks).toHaveLength(1)
    expect(bookmarks[0]?.createdAt.getTime()).toBe(createdAt.getTime())
  })

  test('이미 한도에 도달했고 확장도 없으면 403을 반환한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()

    await seedBookmarks(
      user.id,
      Array.from({ length: 500 }, (_, index) => ({
        mangaId: index + 1,
      })),
    )

    const response = await requestBackend({
      path: '/api/v1/bookmark/9001',
      method: 'PUT',
      cookies: auth.cookieHeader,
    })

    await expectProblemResponse(response, {
      status: 403,
      code: 'libo-expansion-required',
      detail: '북마크 저장 한도에 도달했어요',
      instance: '/api/v1/bookmark/9001',
    })

    expect((await listBookmarksForUser(user.id)).map(({ mangaId }) => mangaId)).not.toContain(9001)
  })
})
