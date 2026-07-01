import type { Consumer, EachMessagePayload } from 'kafkajs'
import type { z } from 'zod'

import { kafka } from './client'

export type { EachMessagePayload }

export function createConsumer(groupId: string): Consumer {
  return kafka.consumer({
    groupId,
    allowAutoTopicCreation: false,
  })
}

export interface TopicRoute<T = any> {
  schema: z.ZodType<T>
  handle: (data: T, payload: EachMessagePayload) => Promise<void>
}

// Helper to preserve type inference for the handler callback
export function createTopicRoute<T>(
  schema: z.ZodType<T>,
  handle: (data: T, payload: EachMessagePayload) => Promise<void>,
): TopicRoute<T> {
  return { schema, handle }
}

export interface RunConsumerOptions {
  fromBeginning?: boolean
  partitionsConsumedConcurrently?: number
  handlers: Record<string, TopicRoute>
}

export async function runConsumer(
  consumer: Consumer,
  { fromBeginning = false, partitionsConsumedConcurrently, handlers }: RunConsumerOptions,
) {
  const topics = Object.keys(handlers)

  await consumer.connect()
  await consumer.subscribe({ topics, fromBeginning })

  await consumer.run({
    partitionsConsumedConcurrently,
    eachMessage: async (payload) => {
      const { topic, message } = payload
      const route = handlers[topic]

      if (!route) {
        console.error(`kafka: dropping message, no handler registered for topic ${topic}`)
        return
      }

      if (!message.value) {
        return
      }

      let json: unknown
      try {
        json = JSON.parse(message.value.toString())
      } catch {
        console.error(`kafka: dropping non-JSON message from topic ${topic}`)
        return
      }

      const parsed = route.schema.safeParse(json)
      if (!parsed.success) {
        console.error(`kafka: dropping invalid event from topic ${topic}`, parsed.error.issues)
        return
      }

      await route.handle(parsed.data, payload)
    },
  })
}
