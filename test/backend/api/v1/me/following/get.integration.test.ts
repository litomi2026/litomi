import { describe, expect, test } from 'bun:test'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { createAccessTokenCookies } from '@test/backend/setup/auth'
import { seedUser, seedUserFollow } from '@test/backend/setup/db'
import { expectProblemResponse } from '@test/backend/setup/problem'

import { privateCacheControl } from '@/utils/cache-control'

installBackendIntegrationHooks()

describe('GET /api/v1/me/following', () => {
  test('인증 정보가 없으면 401을 반환한다', async () => {
    const response = await requestBackend({ path: '/api/v1/me/following' })

    await expectProblemResponse(response, {
      status: 401,
      code: 'authentication-required',
      detail: '로그인 정보가 없거나 만료됐어요',
      instance: '/api/v1/me/following',
    })
  })

  test('현재 사용자가 팔로우한 사용자 id 목록만 반환한다', async () => {
    const me = await seedUser()
    const followedUser = await seedUser()
    const otherFollowedUser = await seedUser()
    const unrelatedUser = await seedUser()
    const auth = await createAccessTokenCookies({ userId: me.id })

    await seedUserFollow({ followerId: me.id, followeeId: followedUser.id })
    await seedUserFollow({ followerId: me.id, followeeId: otherFollowedUser.id })
    await seedUserFollow({ followerId: unrelatedUser.id, followeeId: me.id })

    const response = await requestBackend({
      path: '/api/v1/me/following',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(privateCacheControl)

    const body = await response.json()

    expect([...body.userIds].sort((a: number, b: number) => a - b)).toEqual(
      [followedUser.id, otherFollowedUser.id].sort((a, b) => a - b),
    )
  })
})
