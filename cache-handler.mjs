import { RedisCacheHandler } from '@mrjasonroy/cache-components-cache-handler'
import { Buffer } from 'node:buffer'

export default class NextCacheHandler extends RedisCacheHandler {
  constructor(options = {}) {
    super({
      ...options,
      redis: process.env.REDIS_URL,
    })
  }

  async get(key, meta) {
    const result = await super.get(key, meta)

    if (!result || !result.value) {
      return result
    }

    return { ...result, value: reviveImageCacheValue(result.value) }
  }

  async set(key, value, context) {
    return super.set(key, serializeImageCacheValue(value), context)
  }
}

function reviveImageCacheValue(value) {
  if (!value || value.kind !== 'IMAGE') {
    return value
  }

  const buf = value.buffer

  // New format (we store base64)
  if (typeof buf === 'string') {
    return { ...value, buffer: Buffer.from(buf, 'base64') }
  }

  return value
}

function serializeImageCacheValue(value) {
  if (!value || value.kind !== 'IMAGE') {
    return value
  }

  const buf = value.buffer
  if (Buffer.isBuffer(buf)) {
    return { ...value, buffer: buf.toString('base64') }
  }

  // If we somehow already have a base64 string or legacy object, keep it as-is.
  return value
}
