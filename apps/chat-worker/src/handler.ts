import { getChatArtistById, getChatSenderBrief } from '@litomi/db/app/query/chat'
import {
  artistAggregateRoom,
  broadcastRoom,
  type ChatBroadcastRow,
  type ChatDmMessageRow,
  fanInboundRoom,
  putBroadcast,
  putDmMessage,
  replyRoom,
  upsertBroadcastSummary,
} from '@litomi/db/chat/query'
import {
  type ChatBroadcastEvent,
  type ChatDirectMessageEvent,
  type ChatMessageEvent,
  type ChatPushPayload,
  publishPushFanout,
} from '@litomi/events'
import { roomChannel } from '@litomi/kv/channels'
import { publisherClient } from '@litomi/kv/pubsub'

const PUSH_BODY_MAX_LENGTH = 120

// The core path: durably record the message, relay it in realtime, and emit a push INTENT.
// It never sends web push itself — all delivery is owned by the chat-push worker, so a huge
// fan-out can never delay this latency-sensitive path. Throwing triggers a Kafka retry;
// persist is idempotent and the push enqueue is best-effort (swallowed).
export async function processChatMessage(event: ChatMessageEvent): Promise<void> {
  if (event.kind === 'broadcast') {
    await processBroadcast(event)
  } else {
    await processDirectMessage(event)
  }
}

async function processBroadcast(event: ChatBroadcastEvent): Promise<void> {
  const row: ChatBroadcastRow = {
    artistId: event.artistId,
    messageId: event.messageId,
    contentType: event.contentType,
    content: event.content,
    createdAt: new Date(event.createdAt),
  }

  // Persist (idempotent on PK) then summarize (drives the fan chat list) — both on the
  // critical path so a failure retries the whole message.
  await putBroadcast(row)

  await upsertBroadcastSummary({
    artistId: event.artistId,
    lastMessageId: event.messageId,
    lastPreview: previewBody(event.content),
    lastCreatedAt: row.createdAt,
  })

  // Relay to the broadcast room (fans + owner subscribe).
  await publisherClient.publish(roomChannel(broadcastRoom(event.artistId)), JSON.stringify(toBroadcastRelay(row)))

  // Hand the audience fan-out to chat-push. Best-effort — a failed enqueue must not retry
  // the whole message (persist + relay already succeeded).
  try {
    const artist = await getChatArtistById(event.artistId)
    if (!artist) {
      return
    }

    await publishPushFanout({
      kind: 'broadcast',
      artistId: event.artistId,
      messageId: event.messageId,
      excludeUserId: artist.userId ?? event.artistId,
      afterUserId: 0,
      payload: {
        title: artist.emoji ? `${artist.emoji} ${artist.displayName}` : artist.displayName,
        body: previewBody(event.content),
        url: `/sobok/${artist.handle}`,
        tag: `chat:${event.artistId}`,
      },
    })
  } catch (error) {
    console.error('chat-worker: broadcast push enqueue failed', { messageId: event.messageId, error })
  }
}

async function processDirectMessage(event: ChatDirectMessageEvent): Promise<void> {
  const row: ChatDmMessageRow = {
    artistId: event.artistId,
    fanId: event.fanId,
    contextMessageId: event.contextMessageId,
    messageId: event.messageId,
    senderRole: event.senderRole,
    quotedMessageId: event.quotedMessageId,
    contentType: event.contentType,
    content: event.content,
    createdAt: new Date(event.createdAt),
  }

  // Persist (idempotent) on the critical path.
  await putDmMessage(row)

  if (event.senderRole === 'fan') {
    await relayFanReply(event, row)
  } else {
    await relayArtistReply(event, row)
  }
}

// Fan's reply → the artist. Relay to the focused reply room (un-sampled: the artist may have
// it open) always, and to the artist's aggregate inbound channel SAMPLED (a reply storm can
// never flood the artist's inbox badge). Then push to the artist.
async function relayFanReply(event: ChatDirectMessageEvent, row: ChatDmMessageRow): Promise<void> {
  const fan = await getChatSenderBrief(event.fanId).catch(() => undefined)
  const payload = JSON.stringify(toFanReplyRelay(row, fan))

  await publisherClient.publish(roomChannel(replyRoom(event.artistId, event.contextMessageId)), payload)

  if (await allowTickerRelay(event.artistId)) {
    await publisherClient.publish(roomChannel(artistAggregateRoom(event.artistId)), payload)
  }

  try {
    const artist = await getChatArtistById(event.artistId)
    // 탈퇴한 아티스트(수신자 없음)이거나 아티스트 스스로 보낸 답장이면 푸시하지 않는다.
    if (!artist || artist.userId === null || artist.userId === event.fanId) {
      return
    }

    await pushDirect(event.artistId, artist.userId, {
      title: fan?.nickname ?? '팬',
      body: previewBody(event.content),
      url: `/sobok/studio/${artist.handle}`,
      tag: `chat-reply:${event.artistId}`,
      ...(fan?.imageURL && { icon: fan.imageURL }),
    })
  } catch (error) {
    console.error('chat-worker: fan reply push enqueue failed', { messageId: event.messageId, error })
  }
}

// Artist's 1:1 answer → the one fan. Relay to that fan's inbound channel (un-sampled: one
// artist writing, no storm), then push to the fan.
async function relayArtistReply(event: ChatDirectMessageEvent, row: ChatDmMessageRow): Promise<void> {
  await publisherClient.publish(
    roomChannel(fanInboundRoom(event.artistId, event.fanId)),
    JSON.stringify(toArtistReplyRelay(row)),
  )

  try {
    const artist = await getChatArtistById(event.artistId)
    if (!artist) {
      return
    }

    await pushDirect(event.artistId, event.fanId, {
      title: artist.emoji ? `${artist.emoji} ${artist.displayName}` : artist.displayName,
      body: previewBody(event.content),
      url: `/sobok/${artist.handle}`,
      tag: `chat-dm:${event.artistId}`,
      ...(artist.imageURL && { icon: artist.imageURL }),
    })
  } catch (error) {
    console.error('chat-worker: artist reply push enqueue failed', { messageId: event.messageId, error })
  }
}

function pushDirect(artistId: number, recipientUserId: number, payload: ChatPushPayload): Promise<void> {
  return publishPushFanout({ kind: 'direct', artistId, recipientUserId, payload })
}

// The artist inbound aggregate is a sampled view: cap the fan-reply relay to
// TICKER_SAMPLE_PER_SEC per artist (fixed 1s window) so a burst can't flood the socket.
// Best-effort — a counter hiccup must never break the relay, so it fails open.
const TICKER_SAMPLE_PER_SEC = 5

async function allowTickerRelay(artistId: number): Promise<boolean> {
  try {
    const windowKey = `chat:ticker:${artistId}:${Math.floor(Date.now() / 1000)}`
    const count = await publisherClient.incr(windowKey)

    if (count === 1) {
      await publisherClient.expire(windowKey, 2)
    }

    return count <= TICKER_SAMPLE_PER_SEC
  } catch {
    return true
  }
}

// --- Wire relay builders (must match @litomi/contracts ChatRelayMessageDTO) ---------------

function toBroadcastRelay(row: ChatBroadcastRow) {
  return {
    kind: 'broadcast' as const,
    messageId: row.messageId,
    contentType: row.contentType,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  }
}

type ChatSenderBrief = { nickname: string; imageURL: string | null }

function toFanReplyRelay(row: ChatDmMessageRow, fan?: ChatSenderBrief) {
  return {
    kind: 'fanReply' as const,
    messageId: row.messageId,
    contextMessageId: row.contextMessageId,
    fanId: row.fanId,
    quotedMessageId: row.quotedMessageId,
    contentType: row.contentType,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
    ...(fan && { fan: { nickname: fan.nickname, imageURL: fan.imageURL } }),
  }
}

function toArtistReplyRelay(row: ChatDmMessageRow) {
  return {
    kind: 'artistReply' as const,
    messageId: row.messageId,
    contextMessageId: row.contextMessageId,
    quotedMessageId: row.quotedMessageId,
    contentType: row.contentType,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  }
}

function previewBody(content: unknown): string {
  const text = extractTextContent(content)

  if (!text) {
    return '새 메시지가 도착했어요'
  }

  return text.length > PUSH_BODY_MAX_LENGTH ? `${text.slice(0, PUSH_BODY_MAX_LENGTH)}…` : text
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
