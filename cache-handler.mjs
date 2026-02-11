import {
  CompositeHandler,
  createMemoryCacheHandler,
  RedisCacheHandler,
} from '@mrjasonroy/cache-components-cache-handler'
import fs from 'node:fs'
import path from 'node:path'

export default class LitomiIsrCacheHandler extends CompositeHandler {
  constructor(_options) {
    const prefix = getBuildScopedPrefix()
    const memory = createMemoryCacheHandler({ maxItemSizeBytes: 10 * 1024 * 1024 })
    const redisURL = process.env.REDIS_URL

    if (redisURL) {
      const redis = new RedisCacheHandler({
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
