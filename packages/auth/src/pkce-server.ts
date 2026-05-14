'use server'

import crypto from 'crypto'

import { redisClient } from '@/database/redis'

import { sec } from './format/date'

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

  try {
    const key = getPKCEChallengeKey(authorizationCode)
    await redisClient.set(key, challenge, { ex: sec('3 minutes') })
  } catch (error) {
    console.error('initiatePKCEChallenge:', error)
    throw new Error('Service temporarily unavailable')
  }

  return { authorizationCode }
}

export async function verifyPKCEChallenge(
  authorizationCode: string,
  codeVerifier: string,
  fingerprint: string,
): Promise<{ valid: false; reason: string } | { valid: true; userId: number }> {
  try {
    const key = getPKCEChallengeKey(authorizationCode)
    const authChallenge = await redisClient.getdel<AuthChallenge>(key)

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
  } catch (error) {
    console.error('verifyPKCEChallenge:', error)
    return { valid: false, reason: 'session_not_found' }
  }
}

function getPKCEChallengeKey(authorizationCode: string): string {
  return `pkce:authorization:${authorizationCode}`
}
