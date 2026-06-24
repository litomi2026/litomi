import { describe, expect, test } from 'bun:test'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { readUserSettingsByUserId, seedUserSettings } from '@test/backend/setup/db'
import { expectInvalidParams, expectProblemResponse } from '@test/backend/setup/problem'

import { createMeAuthContext } from '../fixtures'

installBackendIntegrationHooks()

describe('PATCH /api/v1/me/settings', () => {
  test('인증 정보가 없으면 401을 반환한다', async () => {
    const response = await requestBackend({
      path: '/api/v1/me/settings',
      method: 'PATCH',
      json: { historySyncEnabled: false },
    })

    await expectProblemResponse(response, {
      status: 401,
      code: 'authentication-required',
      detail: '로그인 정보가 없거나 만료됐어요',
      instance: '/api/v1/me/settings',
    })
  })

  test('빈 patch면 400을 반환하고 설정을 바꾸지 않는다', async () => {
    const { auth, user } = await createMeAuthContext()

    const response = await requestBackend({
      path: '/api/v1/me/settings',
      method: 'PATCH',
      cookies: auth.cookieHeader,
      json: {},
    })

    await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      detail: '입력을 확인해 주세요',
      instance: '/api/v1/me/settings',
    })

    expect(await readUserSettingsByUserId(user.id)).toBeNull()

    const meResponse = await requestBackend({
      path: '/api/v1/me',
      cookies: auth.cookieHeader,
    })

    expect(meResponse.status).toBe(200)
    expect(await meResponse.json()).toMatchObject({
      settings: {
        historySyncEnabled: true,
        adultVerifiedAdVisible: false,
        autoDeletionDay: 90,
      },
    })
  })

  test('유효하지 않은 autoDeletionDay면 400을 반환하고 기존 설정을 유지한다', async () => {
    const { auth, user } = await createMeAuthContext()

    await seedUserSettings({
      userId: user.id,
      historySyncEnabled: false,
      adultVerifiedAdVisible: true,
      autoDeletionDay: 30,
    })

    const response = await requestBackend({
      path: '/api/v1/me/settings',
      method: 'PATCH',
      cookies: auth.cookieHeader,
      json: { autoDeletionDay: 1501 },
    })

    const problem = await expectProblemResponse(response, {
      status: 400,
      code: 'invalid-input',
      detail: '입력을 확인해 주세요',
      instance: '/api/v1/me/settings',
    })

    expectInvalidParams(problem, [{ name: 'autoDeletionDay' }])
    expect(await readUserSettingsByUserId(user.id)).toMatchObject({
      userId: user.id,
      historySyncEnabled: false,
      adultVerifiedAdVisible: true,
      autoDeletionDay: 30,
    })

    const meResponse = await requestBackend({
      path: '/api/v1/me',
      cookies: auth.cookieHeader,
    })

    expect(meResponse.status).toBe(200)
    expect(await meResponse.json()).toMatchObject({
      settings: {
        historySyncEnabled: false,
        adultVerifiedAdVisible: true,
        autoDeletionDay: 30,
      },
    })
  })

  test('설정 행이 없어도 기본 설정을 기준으로 upsert한다', async () => {
    const { auth, user } = await createMeAuthContext()

    const response = await requestBackend({
      path: '/api/v1/me/settings',
      method: 'PATCH',
      cookies: auth.cookieHeader,
      json: { historySyncEnabled: false },
    })

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')

    expect(await readUserSettingsByUserId(user.id)).toMatchObject({
      userId: user.id,
      historySyncEnabled: false,
      adultVerifiedAdVisible: false,
      autoDeletionDay: 90,
    })

    const meResponse = await requestBackend({
      path: '/api/v1/me',
      cookies: auth.cookieHeader,
    })

    expect(meResponse.status).toBe(200)
    expect(await meResponse.json()).toMatchObject({
      settings: {
        historySyncEnabled: false,
        adultVerifiedAdVisible: false,
        autoDeletionDay: 90,
      },
    })
  })

  test('부분 수정이면 지정하지 않은 설정은 유지한다', async () => {
    const { auth, user } = await createMeAuthContext()
    await seedUserSettings({
      userId: user.id,
      historySyncEnabled: false,
      adultVerifiedAdVisible: true,
      autoDeletionDay: 30,
    })

    const response = await requestBackend({
      path: '/api/v1/me/settings',
      method: 'PATCH',
      cookies: auth.cookieHeader,
      json: { adultVerifiedAdVisible: false },
    })

    expect(response.status).toBe(204)
    expect(await response.text()).toBe('')

    expect(await readUserSettingsByUserId(user.id)).toMatchObject({
      userId: user.id,
      historySyncEnabled: false,
      adultVerifiedAdVisible: false,
      autoDeletionDay: 30,
    })

    const meResponse = await requestBackend({
      path: '/api/v1/me',
      cookies: auth.cookieHeader,
    })

    expect(meResponse.status).toBe(200)
    expect(await meResponse.json()).toMatchObject({
      settings: {
        historySyncEnabled: false,
        adultVerifiedAdVisible: false,
        autoDeletionDay: 30,
      },
    })
  })
})
