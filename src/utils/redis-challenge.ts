'use server'

import { ChallengeType } from '@/database/enum'
import { redisClient } from '@/database/redis'

import { sec } from './format/date'

/**
 * Get and delete a challenge atomically
 */
export async function getAndDeleteChallenge(identifier: number | string, type: ChallengeType): Promise<string | null> {
  try {
    const key = getChallengeKey(identifier, type)
    return await redisClient.getdel<string>(key)
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
  challenge: string
): Promise<void> {
  try {
    const key = getChallengeKey(identifier, type)
    await redisClient.set(key, challenge, { ex: sec('3 minutes') })
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
