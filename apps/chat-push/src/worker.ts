import {
  chatPushFanoutEventSchema,
  createConsumer,
  createTopicRoute,
  disconnectProducer,
  runConsumer,
  TOPIC_CHAT_PUSH_FANOUT,
} from '@litomi/events'
import { registerShutdownHandler, registerShutdownSignals } from '@litomi/std'
import { processPushFanout } from './handler'
import { markDraining, startHealthServer } from './health'

// Fan-out pages are order-independent, so process several partitions at once per instance.
const PARTITIONS_CONCURRENCY = 3

const healthServer = startHealthServer()
const consumer = createConsumer('chat-push')

registerShutdownHandler('probe', () => markDraining())
registerShutdownHandler('kafka', () => consumer.disconnect())
registerShutdownHandler('producer', () => disconnectProducer())
registerShutdownHandler('health-server', () => healthServer.stop(true))
registerShutdownSignals()

await runConsumer(consumer, {
  partitionsConsumedConcurrently: PARTITIONS_CONCURRENCY,
  handlers: {
    [TOPIC_CHAT_PUSH_FANOUT]: createTopicRoute(chatPushFanoutEventSchema, async (data) => {
      // delivery is at-least-once (duplicates collapse on-device
      // via the payload `tag`), so a transient failure never drops a recipient.
      await processPushFanout(data)
    }),
  },
})

console.info(`litomi chat-push consuming ${TOPIC_CHAT_PUSH_FANOUT} (health on :${healthServer.port})`)
