import { RedisCacheHandler } from '@mrjasonroy/cache-components-cache-handler'
import { Buffer } from 'node:buffer'

export default class NextCacheHandler extends RedisCacheHandler {
  constructor(options = {}) {
    super({
      ...options,
      redis: process.env.REDIS_URL,
      keyPrefix: getKeyPrefix(),
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

function getKeyPrefix() {
  const explicit = process.env.NEXT_CACHE_KEY_PREFIX
  if (explicit) return explicit

  const sha = process.env.COMMIT_SHA
  if (typeof sha === 'string' && sha.length > 0) return sha.slice(0, 8)

  return 'local'
}

function normalizeToBuffer(buf) {
  if (!buf) return null
  if (Buffer.isBuffer(buf)) return buf

  // Common JSON-serialized Buffer shape: { type: 'Buffer', data: number[] }
  if (typeof buf === 'object' && buf.type === 'Buffer' && Array.isArray(buf.data)) {
    return Buffer.from(buf.data)
  }

  // Some runtimes store as Uint8Array / ArrayBuffer.
  if (buf instanceof Uint8Array) {
    return Buffer.from(buf)
  }

  if (buf instanceof ArrayBuffer) {
    return Buffer.from(new Uint8Array(buf))
  }

  // Sometimes an array of bytes slips through.
  if (Array.isArray(buf)) {
    return Buffer.from(buf)
  }

  return null
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

  const normalized = normalizeToBuffer(buf)
  if (normalized) {
    return { ...value, buffer: normalized }
  }

  return value
}

function serializeImageCacheValue(value) {
  if (!value || value.kind !== 'IMAGE') {
    return value
  }

  const buf = value.buffer

  const normalized = normalizeToBuffer(buf)
  if (normalized) {
    return { ...value, buffer: normalized.toString('base64') }
  }

  // If we somehow already have a base64 string or legacy object, keep it as-is.
  return value
}
