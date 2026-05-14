import { PostType } from '@litomi/domain/database/enum'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { createAccessTokenCookies } from '@test/backend/setup/auth'
import { seedPost, seedUser, seedUserFollow } from '@test/backend/setup/db'
import { expectProblemResponse } from '@test/backend/setup/problem'
import { describe, expect, test } from 'bun:test'

import { privateCacheControl } from '@/utils/cache-control'

installBackendIntegrationHooks()

describe('GET /api/v1/post?filter=0', () => {
  test('인증 정보가 없으면 401을 반환한다', async () => {
    const response = await requestBackend({ path: '/api/v1/post?filter=0' })

    await expectProblemResponse(response, {
      status: 401,
      code: 'unauthorized',
      detail: '로그인 정보가 없거나 만료됐어요',
      instance: '/api/v1/post?filter=0',
    })
  })

  test('팔로우한 사용자의 글만 최신순으로 반환한다', async () => {
    const me = await seedUser()
    const followedUser = await seedUser({ name: 'followed-user' })
    const alsoFollowedUser = await seedUser({ name: 'also-followed-user' })
    const unfollowedUser = await seedUser({ name: 'unfollowed-user' })
    const auth = await createAccessTokenCookies({ userId: me.id })

    await seedUserFollow({ followerId: me.id, followeeId: followedUser.id })
    await seedUserFollow({ followerId: me.id, followeeId: alsoFollowedUser.id })

    const oldest = await seedPost({
      userId: followedUser.id,
      content: 'oldest followed post',
      createdAt: new Date('2025-01-01T00:00:00.000Z'),
      type: PostType.TEXT,
    })
    const newest = await seedPost({
      userId: alsoFollowedUser.id,
      content: 'newest followed post',
      createdAt: new Date('2025-01-03T00:00:00.000Z'),
      type: PostType.TEXT,
    })
    await seedPost({
      userId: unfollowedUser.id,
      content: 'should be hidden',
      createdAt: new Date('2025-01-04T00:00:00.000Z'),
      type: PostType.TEXT,
    })

    const response = await requestBackend({
      path: '/api/v1/post?filter=0&limit=2',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Cache-Control')).toBe(privateCacheControl)

    const body = await response.json()

    expect(body.nextCursor).toBeNull()
    expect(body.posts.map((post: { id: number }) => post.id)).toEqual([newest.id, oldest.id])
    expect(body.posts.every((post: { author: { id: number } | null }) => post.author?.id !== unfollowedUser.id)).toBe(true)
  })
})
