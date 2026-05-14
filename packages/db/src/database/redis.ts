import { env } from '@litomi/env/env/server.common'
import { Redis } from '@upstash/redis'

const { UPSTASH_KV_REST_API_TOKEN, UPSTASH_KV_REST_API_URL } = env

export const redisClient = new Redis({
  url: UPSTASH_KV_REST_API_URL,
  token: UPSTASH_KV_REST_API_TOKEN,
})
