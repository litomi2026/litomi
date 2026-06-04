import { getdelRedisJson, setRedisJson } from '@litomi/db/redis'

import { BBATON_ATTEMPT_TTL_SECONDS } from './utils'

type BBatonOAuthAttempt = {
  userId: number
}

export async function consumeBBatonOAuthAttempt(state: string): Promise<BBatonOAuthAttempt | null> {
  return await getdelRedisJson<BBatonOAuthAttempt>(getBBatonOAuthAttemptKey(state))
}

export async function storeBBatonOAuthAttempt(state: string, attempt: BBatonOAuthAttempt): Promise<void> {
  await setRedisJson(getBBatonOAuthAttemptKey(state), attempt, { ex: BBATON_ATTEMPT_TTL_SECONDS })
}

function getBBatonOAuthAttemptKey(state: string): string {
  return `oauth:bbaton:state:${state}`
}
