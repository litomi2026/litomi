import { generateSync } from 'otplib'

import { initiatePKCEChallenge } from '@/utils/pkce-server'

import { createPkcePair } from '../../fixtures'

type AuthorizationChallengeInput = {
  fingerprint?: string
  userId: number
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
