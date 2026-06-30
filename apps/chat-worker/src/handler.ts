import { getChatArtistBrief, getChatSenderBrief } from '@litomi/db/app/query/chat'
import {
  type ChatMessageRow,
  type ParsedStreamId,
  parseStreamId,
  putChatMessage,
  toArtistInboundChannel,
  upsertChatThread,
} from '@litomi/db/chat/query'
import { type ChatMessageEvent, type ChatPushPayload, publishPushFanout } from '@litomi/events'
import { roomChannel } from '@litomi/kv/channels'
import { publisherClient } from '@litomi/kv/pubsub'

const PUSH_BODY_MAX_LENGTH = 120

// The core path: durably record the message, relay it in realtime, and emit a push
// INTENT. It never sends web push itself — all delivery is owned by the chat-push worker,
// so a huge fan-out can never delay this latency-sensitive path.
export async function processChatMessage(event: ChatMessageEvent): Promise<void> {
  const parsed = parseStreamId(event.streamId)
  if (!parsed) {
    console.error('chat-worker: dropping message with invalid streamId', { streamId: event.streamId })
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
  // 1. Persist — idempotent on (streamId, messageId).
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

  // 3. Realtime relay. The reply sender's brief is resolved ONCE (best-effort) and reused
  //    for both the relay (studio live ticker) and the push enqueue — no extra DB call.
  const replySender = parsed.kind === 'reply' ? await getChatSenderBrief(event.senderId).catch(() => null) : null

  //    A broadcast relays to its own room (fans + owner subscribe). A reply fans IN to the
  //    artist's owner-only inbound channel — SAMPLED at the source via a per-artist token
  //    bucket so a reply storm can never flood the artist's socket. A dropped relay is
  //    still persisted, counted (server-side unread), and pushed.
  if (parsed.kind === 'broadcast') {
    await publisherClient.publish(roomChannel(event.streamId), JSON.stringify(toClientMessage(row, parsed)))
  } else if (await allowTickerRelay(parsed.artistId)) {
    await publisherClient.publish(
      roomChannel(toArtistInboundChannel(parsed.artistId)),
      JSON.stringify(toClientMessage(row, parsed, replySender)),
    )
  }

  // 4. Hand ALL push delivery to the chat-push worker. Best-effort: a failed enqueue must
  //    not retry the whole message (persist + relay already succeeded).
  try {
    await enqueuePush(event, parsed, replySender)
  } catch (error) {
    console.error('chat-worker: enqueue push failed', { messageId: event.messageId, error })
  }
}

type ChatSenderBrief = { nickname: string; imageURL: string | null }

// Renders the push payload ONCE on the cheap control path and enqueues a fan-out job.
// Broadcast → first keyset page (afterUserId 0); the push worker walks the rest. Reply →
// a single push to the artist (skipped when the artist somehow authored it).
async function enqueuePush(
  event: ChatMessageEvent,
  parsed: ParsedStreamId,
  replySender: ChatSenderBrief | null,
): Promise<void> {
  const artist = await getChatArtistBrief(event.artistId)
  if (!artist) {
    return
  }

  if (parsed.kind === 'broadcast') {
    await publishPushFanout({
      kind: 'broadcast',
      artistId: event.artistId,
      messageId: event.messageId,
      excludeUserId: event.senderId,
      afterUserId: 0,
      payload: {
        title: artist.emoji ? `${artist.emoji} ${artist.displayName}` : artist.displayName,
        body: previewBody(event),
        url: `/sobok/${artist.handle}`,
        tag: `chat:${event.artistId}`,
      },
    })
    return
  }

  if (event.senderId === artist.userId) {
    return
  }

  const payload: ChatPushPayload = {
    title: replySender?.nickname ?? '팬',
    body: previewBody(event),
    url: `/sobok/studio/${artist.handle}`,
    tag: `chat-reply:${event.artistId}`,
    ...(replySender?.imageURL && { icon: replySender.imageURL }),
  }

  await publishPushFanout({
    kind: 'reply',
    artistId: event.artistId,
    messageId: event.messageId,
    recipientUserId: artist.userId,
    payload,
  })
}

// The live ticker is a sampled view: cap the reply relay to TICKER_SAMPLE_PER_SEC per
// artist (fixed 1s window) so a burst can't flood the artist socket. Best-effort — a
// counter hiccup must never break the relay, so it fails open.
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

// Builds the wire envelope from a stored row. The target (broadcast) messageId for a reply
// comes from the already-parsed streamId, so the client receives a semantic field and never
// parses the internal `rb:{artistId}:{messageId}` key itself.
function toClientMessage(row: ChatMessageRow, parsed: ParsedStreamId, sender?: ChatSenderBrief | null) {
  const base = {
    messageId: row.messageId,
    senderId: row.senderId,
    contentType: row.contentType,
    content: row.content,
    createdAt: row.createdAt.toISOString(),
  }

  if (parsed.kind === 'reply') {
    return {
      ...base,
      kind: 'reply' as const,
      targetMessageId: parsed.messageId,
      sender: sender ? { nickname: sender.nickname, imageURL: sender.imageURL } : null,
    }
  }

  return { ...base, kind: 'broadcast' as const }
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
