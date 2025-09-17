'use server'

import { ChallengeType } from '@/database/enum'
import { redisClient } from '@/database/redis'

import { sec } from './date'

/**
 * Get and delete a challenge atomically
 */
export async function getAndDeleteChallenge(userId: number, type: ChallengeType): Promise<string | null> {
  try {
    const key = getChallengeKey(userId, type)
    const pipeline = redisClient.pipeline()
    pipeline.get(key)
    pipeline.del(key)
    const results = await pipeline.exec()
    return results?.[0] as string | null
  } catch (error) {
    console.error('getAndDeleteChallenge:', error)
    return null
  }
}

/**
 * Store a challenge in Redis with 3 minutes TTL
 */
export async function storeChallenge(userId: number, type: ChallengeType, challenge: string): Promise<void> {
  try {
    const key = getChallengeKey(userId, type)
    await redisClient.set(key, challenge, { ex: sec('3 minutes') })
  } catch (error) {
    console.error('storeChallenge:', error)
    throw new Error('Service temporarily unavailable')
  }
}

/**
 * Generate a Redis key for a challenge
 */
function getChallengeKey(userId: number, type: ChallengeType): string {
  return `challenge:${type}:${userId}`
}
