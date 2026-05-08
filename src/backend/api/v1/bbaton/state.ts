import 'server-only'

import { redisClient } from '@/database/redis'

import { BBATON_ATTEMPT_TTL_SECONDS } from './utils'

type BBatonOAuthAttempt = {
  userId: number
}

export async function consumeBBatonOAuthAttempt(state: string): Promise<BBatonOAuthAttempt | null> {
  return await redisClient.getdel<BBatonOAuthAttempt>(getBBatonOAuthAttemptKey(state))
}

export async function storeBBatonOAuthAttempt(state: string, attempt: BBatonOAuthAttempt): Promise<void> {
  await redisClient.set(getBBatonOAuthAttemptKey(state), attempt, { ex: BBATON_ATTEMPT_TTL_SECONDS })
}

function getBBatonOAuthAttemptKey(state: string): string {
  return `oauth:bbaton:state:${state}`
}
