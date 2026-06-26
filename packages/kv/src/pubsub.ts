import { env } from '@litomi/env/server.common'
import Redis from 'ioredis'

const { PUBSUB_REDIS_URL } = env

const REDIS_READY_TIMEOUT_MS = 2_000

// Subscriber must keep its subscriptions alive across reconnects → never give up.
export const subscriberClient = new Redis(PUBSUB_REDIS_URL, {
  connectionName: 'litomi-pubsub-sub',
  enableOfflineQueue: true,
  lazyConnect: true,
  maxRetriesPerRequest: null,
})

// Publisher fails fast so the caller (e.g. the worker) can fall back to its own
// durable retry (Kafka) instead of blocking on a downed Valkey.
export const publisherClient = new Redis(PUBSUB_REDIS_URL, {
  connectionName: 'litomi-pubsub-pub',
  enableOfflineQueue: false,
  lazyConnect: true,
  maxRetriesPerRequest: 3,
})

subscriberClient.on('error', (error) => {
  console.error('redis subscriber:', error)
})

publisherClient.on('error', (error) => {
  console.error('redis publisher:', error)
})

let connectPromise: Promise<void> | null = null

export async function closePubSub(): Promise<void> {
  try {
    await Promise.all([
      subscriberClient.status === 'end' ? Promise.resolve() : subscriberClient.quit(),
      publisherClient.status === 'end' ? Promise.resolve() : publisherClient.quit(),
    ])
  } catch (error) {
    console.error('redis pub/sub quit error:', error)
    subscriberClient.disconnect()
    publisherClient.disconnect()
  }
}

export async function connectPubSub(): Promise<void> {
  if (subscriberClient.status === 'ready' && publisherClient.status === 'ready') {
    return
  }

  if (subscriberClient.status === 'end' || publisherClient.status === 'end') {
    throw new Error('Redis Pub/Sub connection is closed')
  }

  connectPromise ??= Promise.all([performConnection(subscriberClient), performConnection(publisherClient)])
    .then(() => undefined)
    .finally(() => {
      connectPromise = null
    })

  await connectPromise
}

export async function publish(channel: string, message: string): Promise<number> {
  return await publisherClient.publish(channel, message)
}

async function performConnection(client: Redis): Promise<void> {
  if (client.status === 'ready') {
    return
  }

  if (client.status === 'wait') {
    await client.connect()
    return
  }

  await waitForRedisReady(client)
}

async function waitForRedisReady(client: Redis): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error(`Timed out waiting for Redis Pub/Sub readiness while status is ${client.status}`))
    }, REDIS_READY_TIMEOUT_MS)

    const cleanup = () => {
      clearTimeout(timeout)
      client.off('ready', onReady)
      client.off('end', onEnd)
      client.off('error', onError)
    }

    const onReady = () => {
      cleanup()
      resolve()
    }

    const onEnd = () => {
      cleanup()
      reject(new Error('Redis Pub/Sub connection ended before becoming ready'))
    }

    const onError = (error: Error) => {
      cleanup()
      reject(error)
    }

    client.once('ready', onReady)
    client.once('end', onEnd)
    client.once('error', onError)
  })
}
