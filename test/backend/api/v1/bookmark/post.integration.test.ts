import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { createAccessTokenCookies } from '@test/backend/setup/auth'
import { seedBookmark, seedBookmarks, seedUser } from '@test/backend/setup/db'
import { describe, expect, test } from 'bun:test'

import { bookmarkTable } from '@/database/supabase/activity'
import { db } from '@/database/supabase/drizzle'

installBackendIntegrationHooks()

describe('POST /api/v1/bookmark', () => {
  test('유효하지 않은 mangaIds는 400을 반환하고 저장하지 않는다', async () => {
    const user = await seedUser()
    const auth = await createAccessTokenCookies({ userId: user.id })

    const response = await requestBackend({
      path: '/api/v1/bookmark',
      method: 'POST',
      cookies: auth.cookieHeader,
      json: {
        mangaIds: [],
      },
    })

    expect(response.status).toBe(400)
    expect(await response.json()).toMatchObject({ status: 400 })

    const rows = await db.select().from(bookmarkTable)
    expect(rows).toHaveLength(0)
  })

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
