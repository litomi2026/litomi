import { PasskeyAuthenticationAttempt } from '@litomi/auth/passkey-authentication-attempt'
import { getdelRedisJson, setRedisJson } from '@litomi/db/redis'
import { ChallengeType } from '@litomi/domain/auth/model'
import { sec } from '@litomi/std'

/**
 * Get and delete a challenge atomically
 */
export async function getAndDeleteChallenge<T = string>(
  identifier: number | string,
  type: ChallengeType,
): Promise<T | null> {
  try {
    const key = getChallengeKey(identifier, type)
    return await getdelRedisJson<T>(key)
  } catch (error) {
    console.error('getAndDeleteChallenge:', error)
    return null
  }
}

/**
 * Store a challenge in Redis with 3 minutes TTL
 */
export async function storeChallenge(
  identifier: number | string,
  type: ChallengeType,
  challenge: string | PasskeyAuthenticationAttempt,
): Promise<void> {
  try {
    const key = getChallengeKey(identifier, type)
    await setRedisJson(key, challenge, { ex: sec('3 minutes') })
  } catch (error) {
    console.error('storeChallenge:', error)
    throw new Error('Service temporarily unavailable')
  }
}

/**
 * Generate a Redis key for a challenge
 */
function getChallengeKey(identifier: number | string, type: ChallengeType): string {
  return `challenge:${type}:${identifier}`
}
