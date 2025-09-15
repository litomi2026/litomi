import { Redis } from '@upstash/redis'

import { UPSTASH_KV_REST_API_TOKEN, UPSTASH_KV_REST_API_URL } from '@/constants/env'

export const redisClient = new Redis({
  url: UPSTASH_KV_REST_API_URL,
  token: UPSTASH_KV_REST_API_TOKEN,
})
