import { describe, expect, test } from 'bun:test'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { createAccessTokenCookies } from '@test/backend/setup/auth'
import { readUserFollowingIds, seedUser, seedUserFollow } from '@test/backend/setup/db'
import { expectProblemResponse } from '@test/backend/setup/problem'

installBackendIntegrationHooks()

describe('PUT /api/v1/user/:id/follow', () => {
  test('인증 정보가 없으면 401을 반환한다', async () => {
    const targetUser = await seedUser()
    const response = await requestBackend({ method: 'PUT', path: `/api/v1/user/${targetUser.id}/follow` })

    await expectProblemResponse(response, {
      status: 401,
      code: 'authentication-required',
      title: '로그인 정보가 없거나 만료됐어요',
      instance: `/api/v1/user/${targetUser.id}/follow`,
    })
  })

  test('자기 자신은 팔로우할 수 없다', async () => {
    const me = await seedUser()
    const auth = await createAccessTokenCookies({ userId: me.id })

    const response = await requestBackend({
      method: 'PUT',
      path: `/api/v1/user/${me.id}/follow`,
      cookies: auth.cookieHeader,
    })

    await expectProblemResponse(response, {
      status: 400,
      code: 'bad-request',
      detail: '자기 자신은 팔로우할 수 없어요',
      instance: `/api/v1/user/${me.id}/follow`,
    })
  })

  test('없는 사용자를 팔로우하려고 하면 404를 반환한다', async () => {
    const me = await seedUser()
    const auth = await createAccessTokenCookies({ userId: me.id })

    const response = await requestBackend({
      method: 'PUT',
      path: '/api/v1/user/999999/follow',
      cookies: auth.cookieHeader,
    })

    await expectProblemResponse(response, {
      status: 404,
      code: 'not-found',
      detail: '사용자를 찾을 수 없어요',
      instance: '/api/v1/user/999999/follow',
    })
  })

  test('새로 팔로우하면 201을 반환하고 관계를 저장한다', async () => {
    const me = await seedUser()
    const targetUser = await seedUser()
    const auth = await createAccessTokenCookies({ userId: me.id })

    const response = await requestBackend({
      method: 'PUT',
      path: `/api/v1/user/${targetUser.id}/follow`,
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(201)
    expect(await response.json()).toEqual({ following: true })
    expect(await readUserFollowingIds(me.id)).toEqual([targetUser.id])
  })

  test('이미 팔로우 중이면 200으로 멱등하게 처리한다', async () => {
    const me = await seedUser()
    const targetUser = await seedUser()
    const auth = await createAccessTokenCookies({ userId: me.id })

    await seedUserFollow({ followerId: me.id, followeeId: targetUser.id })

    const response = await requestBackend({
      method: 'PUT',
      path: `/api/v1/user/${targetUser.id}/follow`,
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ following: true })
    expect(await readUserFollowingIds(me.id)).toEqual([targetUser.id])
  })
})
