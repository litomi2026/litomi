import type { Consumer, EachMessagePayload } from 'kafkajs'

import { kafka } from './client'

export type { EachMessagePayload }

export function createConsumer(groupId: string): Consumer {
  return kafka.consumer({ groupId })
}

export interface RunConsumerOptions {
  topics: string[]
  fromBeginning?: boolean
  eachMessage: (payload: EachMessagePayload) => Promise<void>
}

export async function runConsumer(consumer: Consumer, options: RunConsumerOptions): Promise<void> {
  await consumer.connect()

  await consumer.subscribe({
    topics: options.topics,
    fromBeginning: options.fromBeginning ?? false,
  })

  await consumer.run({ eachMessage: options.eachMessage })
}
