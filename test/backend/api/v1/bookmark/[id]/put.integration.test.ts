import { describe, expect, test } from 'bun:test'
import { problemCode } from '@litomi/http/problem-details'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { seedBookmark, seedBookmarks, seedUser } from '@test/backend/setup/db'
import { expectInvalidParams, expectProblemResponse } from '@test/backend/setup/problem'

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

  test('다른 사용자가 같은 mangaId를 저장했어도 현재 사용자에게는 새 북마크로 생성한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()
    const otherUser = await seedUser()
    await seedBookmark(otherUser.id, { mangaId: 123, createdAt: new Date('2025-01-01T00:00:00.000Z') })

    const response = await requestBackend({
      path: '/api/v1/bookmark/123',
      method: 'PUT',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(201)
    expect(await response.json()).toMatchObject({ mangaId: 123 })
    expect((await listBookmarksForUser(user.id)).map(({ mangaId }) => mangaId)).toEqual([123])
    expect((await listBookmarksForUser(otherUser.id)).map(({ mangaId }) => mangaId)).toEqual([123])
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
      code: problemCode.LIBO_EXPANSION_REQUIRED,
      detail: '북마크 저장 한도에 도달했어요',
      instance: '/api/v1/bookmark/9001',
    })

    expect((await listBookmarksForUser(user.id)).map(({ mangaId }) => mangaId)).not.toContain(9001)
  })

  test('유효하지 않은 id면 400 invalid-input을 반환한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()

    const response = await requestBackend({
      path: '/api/v1/bookmark/0',
      method: 'PUT',
      cookies: auth.cookieHeader,
    })

    const problem = await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      detail: '입력을 확인해 주세요',
      instance: '/api/v1/bookmark/0',
    })

    expectInvalidParams(problem, [{ name: 'id' }])
    expect(await listBookmarksForUser(user.id)).toEqual([])
  })
})
