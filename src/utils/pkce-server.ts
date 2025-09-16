'use server'

import crypto from 'crypto'

import { redisClient } from '@/database/redis'

import { sec } from './date'

interface AuthChallenge {
  authorizationCode: string
  codeChallenge: string
  fingerprint: string
  userId: number
}

export async function initiatePKCEChallenge(userId: number, codeChallenge: string, fingerprint: string) {
  const authorizationCode = crypto.randomBytes(32).toString('base64url')

  const challenge: AuthChallenge = {
    authorizationCode,
    codeChallenge,
    fingerprint,
    userId,
  }

  const key = getPKCEChallengeKey(authorizationCode)
  await redisClient.set(key, JSON.stringify(challenge), { ex: sec('3 minutes') })

  return { authorizationCode }
}

export async function verifyPKCEChallenge(
  authorizationCode: string,
  codeVerifier: string,
  fingerprint: string,
): Promise<{ valid: false; reason: string } | { valid: true; userId: number }> {
  const key = getPKCEChallengeKey(authorizationCode)
  const pipeline = redisClient.pipeline()
  pipeline.get(key)
  pipeline.del(key)
  const [authChallenge] = await pipeline.exec<[AuthChallenge | null, number]>()

  if (!authChallenge) {
    return { valid: false, reason: 'session_not_found' }
  }

  if (authChallenge.fingerprint !== fingerprint) {
    return { valid: false, reason: 'invalid_fingerprint' }
  }

  const expectedCodeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url')

  if (authChallenge.codeChallenge !== expectedCodeChallenge) {
    return { valid: false, reason: 'invalid_pkce' }
  }

  return { valid: true, userId: authChallenge.userId }
}

function getPKCEChallengeKey(authorizationCode: string): string {
  return `pkce:authorization:${authorizationCode}`
}
