import { IncrementalCache } from '@neshca/cache-handler'
import createLruCache from '@neshca/cache-handler/local-lru'
import createRedisCache from '@neshca/cache-handler/redis-strings'
import { createClient } from 'redis'

const client = createClient({ socket: { host: process.env.REDIS_URL } })

client.on('error', (error) => {
  console.error('Redis error:', error)
})

IncrementalCache.onCreation(async () => {
  const useTtl = false

  await client.connect()

  const redisCache = await createRedisCache({
    client,
    useTtl,
    timeoutMs: 5000,
  })

  const localCache = createLruCache({
    useTtl,
  })

  return {
    cache: [redisCache, localCache],
    useFileSystem: !useTtl,
  }
})

module.exports = IncrementalCache
