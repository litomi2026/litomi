import { afterEach, describe, expect, mock, spyOn, test } from 'bun:test'

import { DeviceType } from '@litomi/domain/auth/model'
import type { RegistrationResponseJSON } from '@simplewebauthn/server'
import * as SimpleWebAuthnServer from '@simplewebauthn/server'
import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import { readPasskeyCredentialByCredentialId } from '@test/backend/setup/db'
import { expectProblemResponse } from '@test/backend/setup/problem'

import { createMeAuthContext } from '../../fixtures'

type VerifyRegistrationResult = Awaited<ReturnType<typeof SimpleWebAuthnServer.verifyRegistrationResponse>>

installBackendIntegrationHooks({ redis: true })

afterEach(() => {
  mock.restore()
})

describe('POST /api/v1/me/passkey/verify', () => {
  test('등록 성공 시 id, credentialId, name, message를 반환하고 기본 이름을 저장한다', async () => {
    const { auth } = await createMeAuthContext()
    await requestRegistrationOptions(auth.cookieHeader)

    spyOn(SimpleWebAuthnServer, 'verifyRegistrationResponse').mockResolvedValue(
      buildVerifiedRegistrationResponse({
        credentialId: 'test-me-passkey-platform',
      }),
    )

    const response = await requestBackend({
      path: '/api/v1/me/passkey/verify',
      method: 'POST',
      cookies: auth.cookieHeader,
      json: {
        registration: buildPasskeyRegistration({
          id: 'test-me-passkey-platform',
          authenticatorAttachment: 'platform',
        }),
      },
    })

    expect(response.status).toBe(200)
    const body = await response.json()

    expect(body).toEqual({
      id: expect.any(Number),
      credentialId: 'test-me-passkey-platform',
      name: '이 기기의 패스키',
      message: '패스키를 등록했어요',
    })

    expect(await readPasskeyCredentialByCredentialId('test-me-passkey-platform')).toMatchObject({
      id: body.id,
      name: '이 기기의 패스키',
      deviceType: DeviceType.PLATFORM,
    })
  })

  test('외부 보안키는 외부 보안키 기본 이름을 저장한다', async () => {
    const { auth } = await createMeAuthContext()
    await requestRegistrationOptions(auth.cookieHeader)

    spyOn(SimpleWebAuthnServer, 'verifyRegistrationResponse').mockResolvedValue(
      buildVerifiedRegistrationResponse({
        credentialId: 'test-me-passkey-cross-platform',
      }),
    )

    const response = await requestBackend({
      path: '/api/v1/me/passkey/verify',
      method: 'POST',
      cookies: auth.cookieHeader,
      json: {
        registration: buildPasskeyRegistration({
          id: 'test-me-passkey-cross-platform',
          authenticatorAttachment: 'cross-platform',
        }),
      },
    })

    expect(response.status).toBe(200)

    expect(await readPasskeyCredentialByCredentialId('test-me-passkey-cross-platform')).toMatchObject({
      name: '외부 보안키',
      deviceType: DeviceType.CROSS_PLATFORM,
    })
  })

  test('Redis challenge가 없으면 403을 반환한다', async () => {
    const { auth } = await createMeAuthContext()

    const response = await requestBackend({
      path: '/api/v1/me/passkey/verify',
      method: 'POST',
      cookies: auth.cookieHeader,
      json: {
        registration: buildPasskeyRegistration({ id: 'test-me-passkey-missing-challenge' }),
      },
    })

    await expectProblemResponse(response, {
      status: 403,
      code: 'forbidden',
      detail: '패스키를 등록할 수 없어요',
      instance: '/api/v1/me/passkey/verify',
    })
  })
})

function buildPasskeyRegistration({
  id,
  authenticatorAttachment = 'platform',
}: {
  authenticatorAttachment?: RegistrationResponseJSON['authenticatorAttachment']
  id: string
}): RegistrationResponseJSON {
  return {
    id,
    rawId: id,
    type: 'public-key',
    authenticatorAttachment,
    response: {
      attestationObject: 'attestation-object',
      clientDataJSON: 'client-data-json',
      transports: ['internal'],
    },
    clientExtensionResults: {},
  }
}

function buildVerifiedRegistrationResponse({ credentialId }: { credentialId: string }): VerifyRegistrationResult {
  return {
    verified: true,
    registrationInfo: {
      credential: {
        id: credentialId,
        publicKey: new Uint8Array([1, 2, 3, 4]),
        counter: 0,
        transports: ['internal'],
      },
    },
  } as VerifyRegistrationResult
}

async function requestRegistrationOptions(cookieHeader: string) {
  const response = await requestBackend({
    path: '/api/v1/me/passkey/options',
    method: 'POST',
    cookies: cookieHeader,
  })

  expect(response.status).toBe(200)
}
