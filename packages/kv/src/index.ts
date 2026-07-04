import Redis from 'ioredis'

import { env } from './env'

const REDIS_COMMAND_TIMEOUT_MS = 5_000
const REDIS_READY_TIMEOUT_MS = 2_000

export const redis = new Redis(env.REDIS_URL, {
  autoResendUnfulfilledCommands: false,
  commandTimeout: REDIS_COMMAND_TIMEOUT_MS,
  connectionName: 'litomi-api',
  enableOfflineQueue: false,
  lazyConnect: true,
  maxRetriesPerRequest: 2,
  reconnectOnError(error) {
    return error.message.includes('READONLY') ? 2 : false
  },
})

redis.on('error', (error) => {
  console.error('redis:', error)
})

let connectPromise: Promise<void> | null = null

export async function closeRedis(): Promise<void> {
  if (redis.status === 'end') {
    return
  }

  try {
    await redis.quit()
  } catch (error) {
    console.error('redis quit:', error)
    redis.disconnect()
  }
}

export async function connectRedis(): Promise<void> {
  if (redis.status === 'ready') {
    return
  }

  if (redis.status === 'end') {
    throw new Error('Redis connection is closed')
  }

  connectPromise ??= performConnection().finally(() => {
    connectPromise = null
  })

  await connectPromise
}

export async function getdelRedisJson<T>(key: string): Promise<T | null> {
  const value = await redis.getdel(key)
  return parseRedisJson<T>(value)
}

export async function getRedisJson<T>(key: string): Promise<T | null> {
  const value = await redis.get(key)
  return parseRedisJson<T>(value)
}

export async function pingRedis(): Promise<void> {
  await connectRedis()
  await redis.ping()
}

export async function setRedisJson(key: string, value: unknown, options?: { ex?: number }): Promise<void> {
  const payload = JSON.stringify(value)

  if (options?.ex) {
    await redis.set(key, payload, 'EX', options.ex)
    return
  }

  await redis.set(key, payload)
}

function parseRedisJson<T>(value: string | null): T | null {
  if (value === null) {
    return null
  }

  return JSON.parse(value) as T
}

async function performConnection(): Promise<void> {
  if (redis.status === 'wait') {
    await redis.connect()
    return
  }

  await waitForRedisReady()
}

async function waitForRedisReady(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error(`Timed out waiting for Redis readiness while status is ${redis.status}`))
    }, REDIS_READY_TIMEOUT_MS)

    const cleanup = () => {
      clearTimeout(timeout)
      redis.off('ready', onReady)
      redis.off('end', onEnd)
      redis.off('error', onError)
    }

    const onReady = () => {
      cleanup()
      resolve()
    }

    const onEnd = () => {
      cleanup()
      reject(new Error('Redis connection ended before becoming ready'))
    }

    const onError = (error: Error) => {
      cleanup()
      reject(error)
    }

    redis.once('ready', onReady)
    redis.once('end', onEnd)
    redis.once('error', onError)
  })
}
