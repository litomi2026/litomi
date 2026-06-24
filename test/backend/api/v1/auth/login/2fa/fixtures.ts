import { initiatePKCEChallenge } from '@litomi/auth/pkce-server'
import type { POSTV1AuthLogin2FARequest } from '@litomi/contracts'
import { TEST_TOTP_SECRET } from '@test/backend/setup/db'
import { generateSync } from 'otplib'

import { createPkcePair } from '../../fixtures'

type AuthorizationChallengeInput = {
  fingerprint?: string
  userId: number
}

type ChallengePayload = Pick<POSTV1AuthLogin2FARequest, 'authorizationCode' | 'codeVerifier' | 'fingerprint'>

export function buildLoginTwoFactorRequest(
  challenge: ChallengePayload,
  overrides: Partial<POSTV1AuthLogin2FARequest> = {},
): POSTV1AuthLogin2FARequest {
  return {
    authorizationCode: challenge.authorizationCode,
    codeVerifier: challenge.codeVerifier,
    fingerprint: challenge.fingerprint,
    remember: overrides.remember ?? false,
    token: overrides.token ?? createValidTotpToken(TEST_TOTP_SECRET),
    trustBrowser: overrides.trustBrowser ?? false,
  }
}

export function createValidTotpToken(secret: string) {
  return generateSync({ secret, strategy: 'totp' })
}

export async function issueAuthorizationChallenge({
  userId,
  fingerprint = 'fp-auth-login-2fa',
}: AuthorizationChallengeInput) {
  const { codeChallenge, codeVerifier } = createPkcePair()
  const { authorizationCode } = await initiatePKCEChallenge(userId, codeChallenge, fingerprint)

  return {
    authorizationCode,
    codeVerifier,
    fingerprint,
  }
}
