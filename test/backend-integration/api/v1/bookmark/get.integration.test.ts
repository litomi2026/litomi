import { installBackendIntegrationHooks } from '@test/backend-integration/setup'
import { requestBackend } from '@test/backend/app'
import { createAccessTokenCookies } from '@test/backend/auth'
import { seedBookmarks, seedUser } from '@test/backend/db'
import { describe, expect, test } from 'bun:test'

import { privateCacheControl } from '@/backend/utils/cache-control'
import { decodeBookmarkCursor } from '@/common/cursor'

installBackendIntegrationHooks()

describe('GET /api/v1/bookmark', () => {
  test('인증 정보가 없으면 401을 반환한다', async () => {
    const response = await requestBackend({
      path: '/api/v1/bookmark',
    })

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({
      status: 401,
      detail: '로그인 정보가 없거나 만료됐어요',
    })
  })

  test('잘못된 cursor를 전달하면 400을 반환한다', async () => {
    const user = await seedUser()
    const auth = await createAccessTokenCookies({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/bookmark?cursor=invalid-cursor',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ status: 400 })
  })

  test('북마크가 없으면 빈 결과와 private cache header를 반환한다', async () => {
    const user = await seedUser()
    const auth = await createAccessTokenCookies({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/bookmark',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(privateCacheControl)
    expect(await response.json()).toEqual({
      bookmarks: [],
      nextCursor: null,
    })
  })

  test('페이지네이션 결과와 nextCursor를 안정적으로 반환한다', async () => {
    const user = await seedUser()
    const auth = await createAccessTokenCookies({ userId: user.id })
    const newest = new Date('2025-01-03T00:00:00.000Z')
    const middle = new Date('2025-01-02T00:00:00.000Z')
    const oldest = new Date('2025-01-01T00:00:00.000Z')

    await seedBookmarks(user.id, [
      { mangaId: 300, createdAt: newest },
      { mangaId: 200, createdAt: middle },
      { mangaId: 100, createdAt: oldest },
    ])

    const response = await requestBackend({
      path: '/api/v1/bookmark?limit=2',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(privateCacheControl)

    const body = await response.json()
    expect(body.bookmarks).toEqual([
      { mangaId: 300, createdAt: newest.getTime() },
      { mangaId: 200, createdAt: middle.getTime() },
    ])

    const nextCursor = decodeBookmarkCursor(body.nextCursor)
    expect(nextCursor).toEqual({
      mangaId: 200,
      timestamp: middle.getTime(),
    })
  })
})
