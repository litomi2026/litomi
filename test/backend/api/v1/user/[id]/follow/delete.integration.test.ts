import { describe, expect, test } from 'bun:test'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { createAccessTokenCookies } from '@test/backend/setup/auth'
import { readUserFollowingIds, seedUser, seedUserFollow } from '@test/backend/setup/db'
import { expectProblemResponse } from '@test/backend/setup/problem'

installBackendIntegrationHooks()

describe('DELETE /api/v1/user/:id/follow', () => {
  test('인증 정보가 없으면 401을 반환한다', async () => {
    const targetUser = await seedUser()
    const response = await requestBackend({ method: 'DELETE', path: `/api/v1/user/${targetUser.id}/follow` })

    await expectProblemResponse(response, {
      status: 401,
      code: 'authentication-required',
      detail: '로그인 정보가 없거나 만료됐어요',
      instance: `/api/v1/user/${targetUser.id}/follow`,
    })
  })

  test('없는 사용자를 언팔로우하려고 해도 204로 멱등하게 처리한다', async () => {
    const me = await seedUser()
    const auth = await createAccessTokenCookies({ userId: me.id })

    const response = await requestBackend({
      method: 'DELETE',
      path: '/api/v1/user/999999/follow',
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(204)
    expect(await readUserFollowingIds(me.id)).toEqual([])
  })

  test('팔로우 관계가 있으면 삭제하고 204를 반환한다', async () => {
    const me = await seedUser()
    const targetUser = await seedUser()
    const auth = await createAccessTokenCookies({ userId: me.id })

    await seedUserFollow({ followerId: me.id, followeeId: targetUser.id })

    const response = await requestBackend({
      method: 'DELETE',
      path: `/api/v1/user/${targetUser.id}/follow`,
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(204)
    expect(await readUserFollowingIds(me.id)).toEqual([])
  })

  test('이미 언팔로우 상태여도 204로 멱등하게 처리한다', async () => {
    const me = await seedUser()
    const targetUser = await seedUser()
    const auth = await createAccessTokenCookies({ userId: me.id })

    const response = await requestBackend({
      method: 'DELETE',
      path: `/api/v1/user/${targetUser.id}/follow`,
      cookies: auth.cookieHeader,
    })

    expect(response.status).toBe(204)
    expect(await readUserFollowingIds(me.id)).toEqual([])
  })
})
