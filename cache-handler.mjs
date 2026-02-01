import { RedisCacheHandler } from '@mrjasonroy/cache-components-cache-handler'

export default class NextCacheHandler extends RedisCacheHandler {
  constructor(options = {}) {
    super({
      ...options,
      redis: process.env.REDIS_URL,
    })
  }
}
