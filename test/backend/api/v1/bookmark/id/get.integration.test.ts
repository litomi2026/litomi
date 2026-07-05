import { describe, expect, test } from 'bun:test'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { seedBookmarks, seedUser } from '@test/backend/setup/db'
import { expectProblemResponse } from '@test/backend/setup/problem'

import { privateCacheControl } from '@/utils/cache-control'

import { createBookmarkAuthContext } from '../fixtures'

installBackendIntegrationHooks()

describe('GET /api/v1/bookmark/id', () => {
  test('인증 정보가 없으면 401을 반환한다', async () => {
    const response = await requestBackend({ path: '/api/v1/bookmark/id' })

    await expectProblemResponse(response, {
      status: 401,
      code: 'authentication-required',
      title: '로그인 정보가 없거나 만료됐어요',
      instance: '/api/v1/bookmark/id',
    })
  })

  test('현재 사용자의 북마크 ID만 반환한다', async () => {
    const { auth, user } = await createBookmarkAuthContext()
    const otherUser = await seedUser()
    const newest = new Date('2025-01-03T00:00:00.000Z')
    const older = new Date('2025-01-02T00:00:00.000Z')
    const oldest = new Date('2025-01-01T00:00:00.000Z')

    await seedBookmarks(user.id, [
      { mangaId: 300, createdAt: newest },
      { mangaId: 200, createdAt: older },
      { mangaId: 100, createdAt: oldest },
    ])

    await seedBookmarks(otherUser.id, [{ mangaId: 999, createdAt: new Date('2025-01-04T00:00:00.000Z') }])

    const response = await requestBackend({
      path: '/api/v1/bookmark/id',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(privateCacheControl)

    const body = await response.json()
    expect(body.mangaIds.toSorted((left: number, right: number) => left - right)).toEqual([100, 200, 300])
  })
})
