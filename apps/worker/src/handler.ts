import {
  getChatCreatorBrief,
  getChatSenderBrief,
  listActiveSubscriberUserIds,
  SUBSCRIBER_PAGE_SIZE,
} from '@litomi/db/app/query/chat'
import {
  type ChatMessageRow,
  getKindFromStreamId,
  type ParsedStreamId,
  parseStreamId,
  putChatMessage,
  upsertChatThread,
} from '@litomi/db/chat/query'
import type { ChatMessageEvent } from '@litomi/events'
import { roomChannel } from '@litomi/kv/channels'
import { publisherClient } from '@litomi/kv/pubsub'
import { isWithinQuietHours, type WebPushMessage, WebPushService } from '@litomi/notifications'

const webPush = WebPushService.getInstance()
const PUSH_BODY_MAX_LENGTH = 120

export async function processChatMessage(event: ChatMessageEvent): Promise<void> {
  const parsed = parseStreamId(event.streamId)
  if (!parsed) {
    // Unparseable streamId can never be routed; retrying won't help, so drop it.
    console.error('worker: dropping message with invalid streamId', { streamId: event.streamId })
    return
  }

  const row: ChatMessageRow = {
    streamId: event.streamId,
    messageId: event.messageId,
    senderId: event.senderId,
    contentType: event.contentType,
    content: event.content,
    createdAt: new Date(event.createdAt),
  }

  // Critical path (throwing here triggers a Kafka retry):
  // 1. Persist — idempotent on (streamId, messageId), SDK rate-limits to <=50/s.
  await putChatMessage(row)

  // 2. Update the conversation summary that powers the chat list & inbox —
  //    idempotent and order-safe (only advances to a newer messageId).
  await upsertChatThread({
    streamId: event.streamId,
    creatorId: event.creatorId,
    fanId: parsed.kind === 'reply' ? parsed.fanId : null,
    lastMessageId: event.messageId,
    lastSenderId: event.senderId,
    lastContentType: event.contentType,
    lastPreview: previewBody(event),
    lastCreatedAt: row.createdAt,
  })

  // 3. Realtime relay to online subscribers via the gateway's Valkey channel.
  await publisherClient.publish(roomChannel(event.streamId), JSON.stringify(toClientMessage(row)))

  try {
    if (parsed.kind === 'broadcast') {
      await fanOutBroadcastPush(event)
    } else {
      await pushReplyNotification(event, parsed)
    }
  } catch (error) {
    console.error('worker: chat web push failed', { messageId: event.messageId, error })
  }
}

function toClientMessage(row: ChatMessageRow) {
  return {
    messageId: row.messageId,
    streamId: row.streamId,
    senderId: row.senderId,
    kind: getKindFromStreamId(row.streamId),
    contentType: row.contentType,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  }
}

// A creator's broadcast notifies every active subscriber.
async function fanOutBroadcastPush(event: ChatMessageEvent): Promise<void> {
  const creator = await getChatCreatorBrief(event.creatorId)
  if (!creator) {
    return
  }

  const payload = {
    title: creator.emoji ? `${creator.emoji} ${creator.displayName}` : creator.displayName,
    body: previewBody(event),
    data: { url: `/chat/${creator.handle}` },
    tag: `chat:${event.creatorId}`,
  }

  // Page subscribers by keyset so a huge audience is fanned out in bounded chunks.
  let afterUserId = 0

  for (;;) {
    const userIds = await listActiveSubscriberUserIds(event.creatorId, { afterUserId, limit: SUBSCRIBER_PAGE_SIZE })
    if (userIds.length === 0) {
      break
    }

    const recipientIds = userIds.filter((userId) => userId !== event.senderId)
    await webPush.sendWebPushesToUsers(await buildDeliverableMessages(recipientIds, payload))

    const lastUserId = userIds[userIds.length - 1]
    if (lastUserId === undefined || userIds.length < SUBSCRIBER_PAGE_SIZE) {
      break
    }

    afterUserId = lastUserId
  }
}

// A 1:1 reply notifies the OTHER party: the creator when a fan writes in, and the
// fan when the creator writes back. The stream's fanId comes from the streamId.
async function pushReplyNotification(
  event: ChatMessageEvent,
  parsed: Extract<ParsedStreamId, { kind: 'reply' }>,
): Promise<void> {
  const creator = await getChatCreatorBrief(event.creatorId)
  if (!creator) {
    return
  }

  // Creator → fan: deep-link the fan to the creator's chat (merged timeline).
  if (event.senderId === creator.userId) {
    if (parsed.fanId === event.senderId) {
      return
    }

    const payload = {
      title: creator.emoji ? `${creator.emoji} ${creator.displayName}` : creator.displayName,
      body: previewBody(event),
      data: { url: `/chat/${creator.handle}` },
      tag: `chat:${event.creatorId}`,
    }

    await webPush.sendWebPushesToUsers(await buildDeliverableMessages([parsed.fanId], payload))
    return
  }

  // Fan → creator: deep-link the creator to this fan's reply thread.
  const sender = await getChatSenderBrief(event.senderId)

  const payload = {
    title: sender?.nickname ?? '팬',
    body: previewBody(event),
    data: { url: `/chat/${creator.handle}/fans/${event.senderId}` },
    tag: `chat-reply:${event.creatorId}:${event.senderId}`,
    icon: sender?.imageURL ?? undefined,
  }

  await webPush.sendWebPushesToUsers(await buildDeliverableMessages([creator.userId], payload))
}

// Drops recipients currently inside their quiet-hours window. maxDaily is
// intentionally not applied: chat is human-authored, so a real message is never
// silently withheld for exceeding an algorithmic-notification cap.
async function buildDeliverableMessages(
  userIds: number[],
  payload: WebPushMessage['payload'],
): Promise<WebPushMessage[]> {
  if (userIds.length === 0) {
    return []
  }

  const settings = await webPush.getPushSettingsOfUsers(userIds)
  const now = new Date()

  return userIds
    .filter((userId) => !isWithinQuietHours(settings.get(userId)!, now))
    .map((userId) => ({ userId, payload }))
}

const FALLBACK_PREVIEWS: Record<string, string> = {
  image: '사진을 보냈어요',
  voice: '음성 메시지를 보냈어요',
  video: '동영상을 보냈어요',
}

function previewBody(event: ChatMessageEvent): string {
  if (event.contentType === 'text') {
    const text = extractTextContent(event.content)
    if (text) {
      return text.length > PUSH_BODY_MAX_LENGTH ? `${text.slice(0, PUSH_BODY_MAX_LENGTH)}…` : text
    }
  }

  return FALLBACK_PREVIEWS[event.contentType] ?? '새 메시지가 도착했어요'
}

function extractTextContent(content: unknown): string {
  if (typeof content === 'string') {
    return content
  }
  if (isRecord(content) && typeof content.text === 'string') {
    return content.text
  }
  return ''
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}
