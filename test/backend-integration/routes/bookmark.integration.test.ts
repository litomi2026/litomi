import { requestBackend } from '@test/backend/app'
import { createAccessTokenCookies } from '@test/backend/auth'
import { seedBookmark, seedBookmarks, seedUser } from '@test/backend/db'
import { describe, expect, test } from 'bun:test'

import { privateCacheControl } from '@/backend/utils/cache-control'
import { decodeBookmarkCursor } from '@/common/cursor'
import { bookmarkTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'

import { installBackendIntegrationHooks } from '../setup'

installBackendIntegrationHooks()

describe('GET /api/v1/bookmark', () => {
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

describe('POST /api/v1/bookmark', () => {
  test('새 북마크를 저장하고 중복 수를 계산한다', async () => {
    const user = await seedUser()
    const auth = await createAccessTokenCookies({ userId: user.id })
    await seedBookmark(user.id, { mangaId: 101 })

    const response = await requestBackend({
      path: '/api/v1/bookmark',
      method: 'POST',
      cookies: auth.cookieHeader,
      json: {
        mangaIds: [101, 101, 102, 103],
      },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      createdMangaIds: [102, 103],
      duplicateCount: 1,
      overflowCount: 0,
    })

    const rows = await db.select().from(bookmarkTable)
    expect(rows).toHaveLength(3)
  })

  test('남은 슬롯보다 많은 요청은 overflowCount에 반영한다', async () => {
    const user = await seedUser()
    const auth = await createAccessTokenCookies({ userId: user.id })

    await seedBookmarks(
      user.id,
      Array.from({ length: 499 }, (_, index) => ({
        mangaId: index + 1,
      })),
    )

    const response = await requestBackend({
      path: '/api/v1/bookmark',
      method: 'POST',
      cookies: auth.cookieHeader,
      json: {
        mangaIds: [1000, 1001],
      },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      createdMangaIds: [1000],
      duplicateCount: 0,
      overflowCount: 1,
    })
  })

  test('이미 한도에 도달했으면 403을 반환한다', async () => {
    const user = await seedUser()
    const auth = await createAccessTokenCookies({ userId: user.id })

    await seedBookmarks(
      user.id,
      Array.from({ length: 500 }, (_, index) => ({
        mangaId: index + 1,
      })),
    )

    const response = await requestBackend({
      path: '/api/v1/bookmark',
      method: 'POST',
      cookies: auth.cookieHeader,
      json: {
        mangaIds: [9999],
      },
    })

    expect(response.status).toBe(403)
    expect(await response.json()).toMatchObject({
      type: 'https://localhost/problems/libo-expansion-required',
      detail: '북마크 저장 한도에 도달했어요',
      status: 403,
    })
  })
})
