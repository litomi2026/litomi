import { env } from '@litomi/env/server.common'
import { chatMessageEventSchema, createConsumer, runConsumer, TOPIC_CHAT_MESSAGE } from '@litomi/events'
import { closePubSub, connectPubSub } from '@litomi/kv/pubsub'
import { registerShutdownHandler, registerShutdownSignals } from '@litomi/std'
import { processChatMessage } from './handler'
import { markDraining, startHealthServer } from './health'

const healthServer = startHealthServer()
const consumer = createConsumer(env.KAFKA_GROUP_ID)

registerShutdownHandler('probe', () => markDraining())
registerShutdownHandler('kafka', () => consumer.disconnect())
registerShutdownHandler('pubsub', () => closePubSub())
registerShutdownHandler('health-server', () => healthServer.stop(true))
registerShutdownSignals()

await connectPubSub()

await runConsumer(consumer, {
  topics: [TOPIC_CHAT_MESSAGE],
  async eachMessage({ message }) {
    if (!message.value) {
      return
    }

    let json: unknown
    try {
      json = JSON.parse(message.value.toString())
    } catch {
      console.error('worker: dropping non-JSON message')
      return
    }

    const parsed = chatMessageEventSchema.safeParse(json)
    if (!parsed.success) {
      console.error('worker: dropping invalid event', parsed.error.issues)
      return
    }

    // Throwing makes kafkajs retry; processChatMessage's critical path is
    // idempotent, and best-effort push failures are swallowed inside it.
    await processChatMessage(parsed.data)
  },
})

console.info(`litomi worker consuming ${TOPIC_CHAT_MESSAGE} (health on :${healthServer.port})`)
