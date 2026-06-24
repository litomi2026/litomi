import { describe, expect, test } from 'bun:test'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { readPasskeyCredentialByCredentialId, seedPasskeyCredential, seedUser } from '@test/backend/setup/db'
import { expectInvalidParams, expectProblemResponse } from '@test/backend/setup/problem'

import { createMeAuthContext } from '../../fixtures'

installBackendIntegrationHooks()

describe('PATCH /api/v1/me/passkey/:id', () => {
  test('패스키 이름을 trim해서 저장한다', async () => {
    const { auth, user } = await createMeAuthContext()
    const credential = await seedPasskeyCredential({
      userId: user.id,
      credentialId: 'test-me-passkey-rename',
      name: '이 기기의 패스키',
    })

    const response = await requestBackend({
      path: `/api/v1/me/passkey/${credential.id}`,
      method: 'PATCH',
      cookies: auth.cookieHeader,
      json: { name: '  내 iPhone  ' },
    })

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({
      id: credential.id,
      name: '내 iPhone',
      message: '패스키 이름을 저장했어요',
    })

    expect(await readPasskeyCredentialByCredentialId('test-me-passkey-rename')).toMatchObject({
      name: '내 iPhone',
    })
  })

  test('빈 이름이나 33자 이상 이름이면 400 invalid-input을 반환한다', async () => {
    const { auth, user } = await createMeAuthContext()
    const credential = await seedPasskeyCredential({
      userId: user.id,
      credentialId: 'test-me-passkey-invalid-name',
      name: '기존 이름',
    })

    const emptyResponse = await requestBackend({
      path: `/api/v1/me/passkey/${credential.id}`,
      method: 'PATCH',
      cookies: auth.cookieHeader,
      json: { name: '   ' },
    })

    const emptyProblem = await expectProblemResponse(emptyResponse, {
      status: 400,
      code: 'invalid-input',
      detail: '입력을 확인해 주세요',
      instance: `/api/v1/me/passkey/${credential.id}`,
    })
    expectInvalidParams(emptyProblem, [{ name: 'name' }])

    const longResponse = await requestBackend({
      path: `/api/v1/me/passkey/${credential.id}`,
      method: 'PATCH',
      cookies: auth.cookieHeader,
      json: { name: '가'.repeat(33) },
    })

    const longProblem = await expectProblemResponse(longResponse, {
      status: 400,
      code: 'invalid-input',
      detail: '입력을 확인해 주세요',
      instance: `/api/v1/me/passkey/${credential.id}`,
    })
    expectInvalidParams(longProblem, [{ name: 'name' }])

    expect(await readPasskeyCredentialByCredentialId('test-me-passkey-invalid-name')).toMatchObject({
      name: '기존 이름',
    })
  })

  test('다른 사용자 패스키는 404를 반환한다', async () => {
    const { auth } = await createMeAuthContext()
    const otherUser = await seedUser()
    const credential = await seedPasskeyCredential({
      userId: otherUser.id,
      credentialId: 'test-me-passkey-other-user',
      name: '다른 사용자 패스키',
    })

    const response = await requestBackend({
      path: `/api/v1/me/passkey/${credential.id}`,
      method: 'PATCH',
      cookies: auth.cookieHeader,
      json: { name: '내 패스키' },
    })

    await expectProblemResponse(response, {
      status: 404,
      code: 'not-found',
      detail: '패스키를 찾을 수 없어요',
      instance: `/api/v1/me/passkey/${credential.id}`,
    })

    expect(await readPasskeyCredentialByCredentialId('test-me-passkey-other-user')).toMatchObject({
      name: '다른 사용자 패스키',
    })
  })
})
