import { describe, expect, test } from 'bun:test'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { createAccessTokenCookies, expectAuthCookiesCleared } from '@test/backend/setup/auth'
import { readUserById, seedUser } from '@test/backend/setup/db'
import { expectInvalidParams, expectProblemResponse } from '@test/backend/setup/problem'

import { createMeAuthContext } from './fixtures'

installBackendIntegrationHooks()

describe('PATCH /api/v1/me', () => {
  test('인증 정보가 없으면 401을 반환한다', async () => {
    const response = await requestBackend({
      path: '/api/v1/me',
      method: 'PATCH',
      json: { nickname: 'New Nickname' },
    })

    await expectProblemResponse(response, {
      status: 401,
      code: 'authentication-required',
      title: '로그인 정보가 없거나 만료됐어요',
      instance: '/api/v1/me',
    })
  })

  test('빈 patch면 400을 반환한다', async () => {
    const { auth, user } = await createMeAuthContext({ id: 3110 })

    const response = await requestBackend({
      path: '/api/v1/me',
      method: 'PATCH',
      cookies: auth.cookieHeader,
      json: {},
    })

    await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      title: '입력을 확인해 주세요',
      instance: '/api/v1/me',
    })

    expect(await readUserById(user.id)).toMatchObject({
      name: user.name,
      nickname: user.nickname,
      imageURL: user.imageURL,
    })
  })

  test('유효하지 않은 name, nickname, imageURL면 400과 invalidParams를 반환한다', async () => {
    const { auth, user } = await createMeAuthContext({ id: 3111 })

    const response = await requestBackend({
      path: '/api/v1/me',
      method: 'PATCH',
      cookies: auth.cookieHeader,
      json: {
        name: '1',
        nickname: 'a',
        imageURL: 'not-a-url',
      },
    })

    const problem = await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      title: '입력을 확인해 주세요',
      instance: '/api/v1/me',
    })

    expectInvalidParams(problem, [{ name: 'name' }, { name: 'nickname' }, { name: 'imageURL' }])
    expect(await readUserById(user.id)).toMatchObject({
      name: user.name,
      nickname: user.nickname,
      imageURL: user.imageURL,
    })
  })

  test('이미 사용 중인 이름이면 409와 invalidParams[name]를 반환한다', async () => {
    const { auth, user } = await createMeAuthContext({ id: 3112 })
    const duplicatedUser = await seedUser({ id: 3113 })

    const response = await requestBackend({
      path: '/api/v1/me',
      method: 'PATCH',
      cookies: auth.cookieHeader,
      json: { name: duplicatedUser.name },
    })

    const problem = await expectProblemResponse(response, {
      status: 409,
      code: 'name-conflict',
      title: '이미 사용 중인 이름이에요',
      instance: '/api/v1/me',
    })

    expectInvalidParams(problem, [{ name: 'name', reason: '이미 사용 중인 이름이에요' }])
    expect(await readUserById(user.id)).toMatchObject({ name: user.name })
  })

  test('부분 수정이면 지정한 필드만 변경한다', async () => {
    const { auth, user } = await createMeAuthContext({
      id: 3114,
      imageURL: 'https://example.com/original.png',
    })

    const response = await requestBackend({
      path: '/api/v1/me',
      method: 'PATCH',
      cookies: auth.cookieHeader,
      json: { nickname: 'Updated Nickname' },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      name: user.name,
      nickname: 'Updated Nickname',
      imageURL: 'https://example.com/original.png',
    })

    expect(await readUserById(user.id)).toMatchObject({
      name: user.name,
      nickname: 'Updated Nickname',
      imageURL: 'https://example.com/original.png',
    })
  })

  test('imageURL이 null이면 프로필 이미지를 제거한다', async () => {
    const { auth, user } = await createMeAuthContext({
      id: 3115,
      imageURL: 'https://example.com/avatar.png',
    })

    const response = await requestBackend({
      path: '/api/v1/me',
      method: 'PATCH',
      cookies: auth.cookieHeader,
      json: { imageURL: null },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      name: user.name,
      nickname: user.nickname,
      imageURL: null,
    })

    expect(await readUserById(user.id)).toMatchObject({
      imageURL: null,
    })
  })

  test('stale auth면 401을 반환하고 인증 쿠키를 비운다', async () => {
    const auth = await createAccessTokenCookies({ userId: 3999 })

    const response = await requestBackend({
      path: '/api/v1/me',
      method: 'PATCH',
      cookies: auth.cookieHeader,
      json: { nickname: 'Updated Nickname' },
    })

    await expectProblemResponse(response, {
      status: 401,
      code: 'authentication-required',
      title: '로그인 정보가 없거나 만료됐어요',
      instance: '/api/v1/me',
    })
    expectAuthCookiesCleared(response)
  })
})
