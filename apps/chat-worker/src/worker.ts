import {
  chatMessageEventSchema,
  createConsumer,
  createTopicRoute,
  disconnectProducer,
  runConsumer,
  TOPIC_CHAT_MESSAGE,
} from '@litomi/events'
import { closePubSub, connectPubSub } from '@litomi/kv/pubsub'
import { registerShutdownHandler, registerShutdownSignals } from '@litomi/std'
import { processChatMessage } from './handler'
import { markDraining, startHealthServer } from './health'

const healthServer = startHealthServer()
const consumer = createConsumer('chat-worker')

registerShutdownHandler('probe', () => markDraining())
registerShutdownHandler('kafka', () => consumer.disconnect())
registerShutdownHandler('producer', () => disconnectProducer())
registerShutdownHandler('pubsub', () => closePubSub())
registerShutdownHandler('health-server', () => healthServer.stop(true))
registerShutdownSignals()

await connectPubSub()

await runConsumer(consumer, {
  handlers: {
    [TOPIC_CHAT_MESSAGE]: createTopicRoute(chatMessageEventSchema, async (data) => {
      // processChatMessage's critical path is idempotent,
      // and a failed push enqueue is swallowed inside it (the relay already happened).
      await processChatMessage(data)
    }),
  },
})

console.info(`litomi chat-worker consuming ${TOPIC_CHAT_MESSAGE} (health on :${healthServer.port})`)
