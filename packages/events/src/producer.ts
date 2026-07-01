import { kafka } from './client'
import type { ChatMessageEvent, ChatPushFanoutEvent } from './schema'
import { TOPIC_CHAT_MESSAGE, TOPIC_CHAT_PUSH_FANOUT } from './topics'

export const producer = kafka.producer({ allowAutoTopicCreation: false })

let producerReady: Promise<void> | null = null

export async function connectProducer(): Promise<void> {
  producerReady ??= producer.connect().catch((error) => {
    producerReady = null
    throw error
  })

  await producerReady
}

export async function disconnectProducer(): Promise<void> {
  if (producerReady === null) {
    return
  }

  producerReady = null
  await producer.disconnect()
}

export async function publishEvent(topic: string, key: string, payload: unknown): Promise<void> {
  await connectProducer()

  await producer.send({
    topic,
    messages: [{ key, value: JSON.stringify(payload) }],
  })
}

// streamId를 기준으로 같은 채팅방(스트림)의 메시지들이 동일한 파티션에 적재되어 처리 순서가 보장되도록 함
export async function publishChatMessage(event: ChatMessageEvent): Promise<void> {
  await publishEvent(TOPIC_CHAT_MESSAGE, event.streamId, event)
}

// artistId로 키잉 — 한 아티스트의 fan-out 페이지들이 같은 파티션에 직렬화되어 continuation
// 체인이 순서대로 진행되고, 서로 다른 아티스트는 파티션 단위로 분산되어 공정하게 처리됩니다.
export async function publishPushFanout(event: ChatPushFanoutEvent): Promise<void> {
  await publishEvent(TOPIC_CHAT_PUSH_FANOUT, String(event.artistId), event)
}
