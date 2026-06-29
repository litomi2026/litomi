import {
  getChatArtistBrief,
  getChatSenderBrief,
  listActiveSubscriberUserIds,
  SUBSCRIBER_PAGE_SIZE,
} from '@litomi/db/app/query/chat'
import {
  type ChatMessageRow,
  getKindFromStreamId,
  parseStreamId,
  putChatMessage,
  toArtistInboundChannel,
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

  // 2. Only the broadcast feed is summarized (it drives the fan chat list). Reply rooms
  //    are not: the artist's per-message unread is counted live, and fans never list them.
  if (parsed.kind === 'broadcast') {
    await upsertChatThread({
      streamId: event.streamId,
      lastMessageId: event.messageId,
      lastSenderId: event.senderId,
      lastContentType: event.contentType,
      lastPreview: previewBody(event),
      lastCreatedAt: row.createdAt,
    })
  }

  // 3. Realtime relay. A broadcast goes to its own room (fans + owner subscribe). A reply
  //    fans IN to the artist's owner-only inbound channel — NOT its rb: stream, which
  //    nobody subscribes to; the messageId rides along in the payload's streamId.
  const relayChannel = parsed.kind === 'broadcast' ? event.streamId : toArtistInboundChannel(parsed.artistId)
  await publisherClient.publish(roomChannel(relayChannel), JSON.stringify(toClientMessage(row)))

  try {
    if (parsed.kind === 'broadcast') {
      await fanOutBroadcastPush(event)
    } else {
      await pushReplyToArtist(event)
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

// A artist's broadcast notifies every active subscriber.
async function fanOutBroadcastPush(event: ChatMessageEvent): Promise<void> {
  const artist = await getChatArtistBrief(event.artistId)
  if (!artist) {
    return
  }

  const payload = {
    title: artist.emoji ? `${artist.emoji} ${artist.displayName}` : artist.displayName,
    body: previewBody(event),
    data: { url: `/sobok/${artist.handle}` },
    tag: `chat:${event.artistId}`,
  }

  // Page subscribers by keyset so a huge audience is fanned out in bounded chunks.
  let afterUserId = 0

  for (;;) {
    const userIds = await listActiveSubscriberUserIds(event.artistId, { afterUserId, limit: SUBSCRIBER_PAGE_SIZE })
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

// A fan's reply notifies the artist only (there is no artist → fan 1:1 reply).
async function pushReplyToArtist(event: ChatMessageEvent): Promise<void> {
  const artist = await getChatArtistBrief(event.artistId)
  if (!artist) {
    return
  }

  // A artist never writes into a reply room, but guard against self-notifying anyway.
  if (event.senderId === artist.userId) {
    return
  }

  const sender = await getChatSenderBrief(event.senderId)

  const payload = {
    title: sender?.nickname ?? '팬',
    body: previewBody(event),
    data: { url: `/sobok/studio/${artist.handle}` },
    tag: `chat-reply:${event.artistId}`,
    icon: sender?.imageURL ?? undefined,
  }

  await webPush.sendWebPushesToUsers(await buildDeliverableMessages([artist.userId], payload))
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
