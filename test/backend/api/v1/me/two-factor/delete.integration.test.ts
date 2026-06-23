import { installBackendIntegrationHooks } from '@test/backend/setup'
import { requestBackend } from '@test/backend/setup/app'
import {
  readTwoFactorBackupCodes,
  readTwoFactorByUserId,
  seedTwoFactor,
  seedTwoFactorBackupCodes,
  TEST_TOTP_SECRET,
} from '@test/backend/setup/db'
import { expectProblemResponse } from '@test/backend/setup/problem'
import { describe, expect, setSystemTime, test } from 'bun:test'
import { generateSync } from 'otplib'

import { createMeSessionAuthContext } from '../fixtures'

installBackendIntegrationHooks({ redis: true })

const TWO_FACTOR_PATH = '/api/v1/me/two-factor'
const TOTP_TIME = new Date('2026-01-01T00:00:00.000Z')

function disableTwoFactor(input: { cookies?: string; json: unknown }) {
  return requestBackend({
    path: TWO_FACTOR_PATH,
    method: 'DELETE',
    cookies: input.cookies,
    json: input.json,
  })
}

describe('DELETE /api/v1/me/two-factor', () => {
  test('유효한 복구 코드로 2단계 인증을 비활성화한다', async () => {
    const { user, cookieHeader } = await createMeSessionAuthContext()
    await seedTwoFactor({ userId: user.id })
    const { codes } = await seedTwoFactorBackupCodes(user.id, 3)

    const response = await disableTwoFactor({ cookies: cookieHeader, json: { token: codes[0]! } })

    expect(response.status).toBe(200)
    expect(await readTwoFactorByUserId(user.id)).toBeNull()
    expect(await readTwoFactorBackupCodes(user.id)).toHaveLength(0)
  })

  test('유효하지 않은 복구 코드는 거부하고 2단계 인증을 유지한다', async () => {
    const { user, cookieHeader } = await createMeSessionAuthContext()
    await seedTwoFactor({ userId: user.id })
    await seedTwoFactorBackupCodes(user.id, 3)

    const response = await disableTwoFactor({ cookies: cookieHeader, json: { token: 'ZZZZ-ZZZZ' } })

    expect(response.status).toBe(400)
    await expectProblemResponse(response, { status: 400, instance: TWO_FACTOR_PATH })
    expect(await readTwoFactorByUserId(user.id)).not.toBeNull()
    expect(await readTwoFactorBackupCodes(user.id)).toHaveLength(3)
  })

  test('유효한 TOTP로도 비활성화된다', async () => {
    const { user, cookieHeader } = await createMeSessionAuthContext()
    await seedTwoFactor({ userId: user.id })

    setSystemTime(TOTP_TIME)

    try {
      const token = generateSync({ secret: TEST_TOTP_SECRET, strategy: 'totp' })
      const response = await disableTwoFactor({ cookies: cookieHeader, json: { token } })

      expect(response.status).toBe(200)
    } finally {
      setSystemTime()
    }

    expect(await readTwoFactorByUserId(user.id)).toBeNull()
  })

  test('인증 정보가 없으면 401을 반환한다', async () => {
    const response = await disableTwoFactor({ json: { token: '000000' } })

    expect(response.status).toBe(401)
  })
})
