import {
  calculateLifespan,
  CompositeHandler,
  createMemoryCacheHandler,
  isExpired,
} from '@mrjasonroy/cache-components-cache-handler'
import Redis from 'ioredis'
import { Buffer } from 'node:buffer'
import fs from 'node:fs'
import path from 'node:path'

const TYPE_KEY = '__litomi_cache_type'

class LitomiRedisCacheHandler {
  debug
  defaultTTL
  keyPrefix
  name = 'redis'
  redis
  tagPrefix

  constructor(options = {}) {
    if (typeof options.redis === 'string') {
      this.redis = new Redis(options.redis)
    } else {
      this.redis = new Redis(options.redis || {})
    }

    this.keyPrefix = options.keyPrefix ?? 'nextjs:cache:'
    this.tagPrefix = options.tagPrefix ?? 'nextjs:tags:'
    this.defaultTTL = options.defaultTTL
    this.debug = options.debug ?? false

    this.redis.on('error', (err) => {
      console.error('[LitomiRedisCacheHandler] Redis connection error:', err)
    })
  }

  async close() {
    try {
      await this.redis.quit()
      this.log('Connection closed')
    } catch (error) {
      console.error('[LitomiRedisCacheHandler] close error:', error)
    }
  }

  async delete(key) {
    try {
      const cacheKey = this.getCacheKey(key)
      await this.redis.del(cacheKey)
      this.log('DELETE', cacheKey)
    } catch (error) {
      console.error('[LitomiRedisCacheHandler] DELETE error:', error)
    }
  }

  async get(key, meta) {
    try {
      const cacheKey = this.getCacheKey(key)
      this.log('GET', cacheKey)

      const data = await this.redis.get(cacheKey)
      if (!data) {
        this.log('GET', cacheKey, 'MISS')
        return null
      }

      const entry = deserializeEntry(data)

      if (entry.lifespan && isExpired(entry.lifespan)) {
        this.log('GET', cacheKey, 'EXPIRED')
        await this.delete(key)
        return null
      }

      const allTags = [...(entry.tags ?? []), ...(meta?.implicitTags ?? [])]
      for (const tag of allTags) {
        const tagKey = this.getTagKey(tag)
        const revalidatedAt = await this.redis.get(tagKey)
        if (revalidatedAt && Number.parseInt(revalidatedAt) > entry.lastModified) {
          this.log('GET', cacheKey, 'STALE (tag revalidated)', tag)
          await this.delete(key)
          return null
        }
      }

      this.log('GET', cacheKey, 'HIT')
      return {
        value: entry.value,
        lastModified: entry.lastModified,
        age: Date.now() - entry.lastModified,
      }
    } catch (error) {
      console.error('[LitomiRedisCacheHandler] GET error:', error)
      return null
    }
  }

  getCacheKey(key) {
    return `${this.keyPrefix}${key}`
  }

  getTagKey(tag) {
    return `${this.tagPrefix}${tag}`
  }

  log(...args) {
    if (this.debug) console.log('[LitomiRedisCacheHandler]', ...args)
  }

  async revalidateTag(tag) {
    try {
      const tagKey = this.getTagKey(tag)
      await this.redis.set(tagKey, Date.now().toString())
      this.log('revalidateTag', tag)

      const keysSetKey = `${tagKey}:keys`
      const cacheKeys = await this.redis.smembers(keysSetKey)
      if (cacheKeys.length > 0) {
        const pipeline = this.redis.pipeline()
        for (const cacheKey of cacheKeys) {
          pipeline.del(cacheKey)
        }
        pipeline.del(keysSetKey)
        await pipeline.exec()
      }
    } catch (error) {
      console.error('[LitomiRedisCacheHandler] revalidateTag error:', error)
    }
  }

  async set(key, value, context) {
    try {
      const cacheKey = this.getCacheKey(key)
      const lifespan = calculateLifespan(context?.revalidate, this.defaultTTL)
      const tags = context?.tags ?? []

      const entry = {
        lastModified: Date.now(),
        lifespan,
        tags,
        value,
      }

      const serialized = serializeEntry(entry)

      let ttl
      if (lifespan?.expireAt) {
        ttl = Math.ceil((lifespan.expireAt - Date.now()) / 1000)
        if (ttl <= 0) {
          this.log('SET', cacheKey, 'SKIP (already expired)')
          return
        }
      }

      if (ttl) {
        await this.redis.setex(cacheKey, ttl, serialized)
        this.log('SET', cacheKey, `TTL=${ttl}s`, `kind=${value?.kind}`)
      } else {
        await this.redis.set(cacheKey, serialized)
        this.log('SET', cacheKey, 'NO_TTL', `kind=${value?.kind}`)
      }

      if (tags.length > 0) {
        const pipeline = this.redis.pipeline()
        for (const tag of tags) {
          const tagKey = this.getTagKey(tag)
          pipeline.sadd(`${tagKey}:keys`, cacheKey)
          if (ttl) pipeline.expire(`${tagKey}:keys`, ttl)
        }
        await pipeline.exec()
      }
    } catch (error) {
      console.error('[LitomiRedisCacheHandler] SET error:', error)
    }
  }
}

export default class LitomiIsrCacheHandler extends CompositeHandler {
  constructor(_options) {
    const prefix = getBuildScopedPrefix()
    const memory = createMemoryCacheHandler({ maxItemSizeBytes: 10 * 1024 * 1024 })
    const redisURL = process.env.REDIS_URL

    if (redisURL) {
      const redis = new LitomiRedisCacheHandler({
        redis: redisURL,
        keyPrefix: `${prefix}next:isr:cache:`,
        tagPrefix: `${prefix}next:isr:tag:`,
      })

      // Runtime: redis -> memory
      super({ handlers: [redis, memory] })
    } else {
      // Build / local run: memory only
      super({ handlers: [memory] })
    }
  }
}

function deserializeEntry(data) {
  return JSON.parse(data, (_key, value) => {
    if (value && typeof value === 'object' && TYPE_KEY in value) {
      if (value[TYPE_KEY] === 'Map') return new Map(value.value)
      if (value[TYPE_KEY] === 'Set') return new Set(value.value)
      if (value[TYPE_KEY] === 'Buffer') return Buffer.from(value.value, 'base64')
      if (value[TYPE_KEY] === 'Uint8Array') return Buffer.from(value.value, 'base64')
      if (value[TYPE_KEY] === 'ArrayBuffer') return Buffer.from(value.value, 'base64').buffer
    }

    return value
  })
}

function getBuildScopedPrefix() {
  // Keep prefixes stable per build to avoid cross-deploy cache collisions.
  // `generateBuildId()` already pins BUILD_ID at build time; `.next/BUILD_ID` is available at runtime in standalone output.
  try {
    const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID')
    const buildId = fs.readFileSync(buildIdPath, 'utf8').trim()
    if (buildId) return `litomi:${buildId}:`
  } catch {
    // ignore
  }
  return 'litomi:'
}

function serializeEntry(entry) {
  return JSON.stringify(entry, (_key, value) => {
    // Preserve Map / Set (Next App Router caches include `segmentData: Map`)
    if (value instanceof Map) {
      return { [TYPE_KEY]: 'Map', value: Array.from(value.entries()) }
    }
    if (value instanceof Set) {
      return { [TYPE_KEY]: 'Set', value: Array.from(value.values()) }
    }

    // Preserve binary data
    if (Buffer.isBuffer(value)) {
      return { [TYPE_KEY]: 'Buffer', value: value.toString('base64') }
    }
    if (value instanceof Uint8Array) {
      return { [TYPE_KEY]: 'Uint8Array', value: Buffer.from(value).toString('base64') }
    }
    if (value instanceof ArrayBuffer) {
      return { [TYPE_KEY]: 'ArrayBuffer', value: Buffer.from(value).toString('base64') }
    }

    return value
  })
}
