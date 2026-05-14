import { Redis } from '@upstash/redis'

import { env } from '@/env/server.common'

const { UPSTASH_KV_REST_API_TOKEN, UPSTASH_KV_REST_API_URL } = env

export const redisClient = new Redis({
  url: UPSTASH_KV_REST_API_URL,
  token: UPSTASH_KV_REST_API_TOKEN,
})
