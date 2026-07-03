import { and, asc, desc, eq, gt, gte, inArray, lt, or, sql } from 'drizzle-orm'
import { encodeTime, ulid } from 'ulid'

import { chatDB } from '../db'
import { chatMessageTable } from '../schema'
import { clampPageSize } from './common'
import { messageReplyStreamRange, toBroadcastStreamId, toMessageReplyStreamId } from './stream'

export type ChatMessageRow = typeof chatMessageTable.$inferSelect

const ULID_TIME_LENGTH = 10
const ULID_RANDOM_MIN = '0'.repeat(16)

export function messageIdAtOrAfter(date: Date): string {
  return encodeTime(date.getTime(), ULID_TIME_LENGTH) + ULID_RANDOM_MIN
}

export interface AppendMessageInput {
  streamId: string
  senderId: number
  contentType: string
  content: unknown
}

export function buildChatMessage(input: AppendMessageInput): ChatMessageRow {
  return {
    ...input,
    messageId: ulid(),
    createdAt: new Date(),
  }
}

export async function putChatMessage(row: ChatMessageRow): Promise<void> {
  await chatDB
    .insert(chatMessageTable)
    .values(row)
    .onConflictDoNothing({ target: [chatMessageTable.streamId, chatMessageTable.messageId] })
}

export async function appendChatMessage(input: AppendMessageInput): Promise<ChatMessageRow> {
  const row = buildChatMessage(input)
  await putChatMessage(row)
  return row
}

export interface ReplyGate {
  ownReplyCount: number
}

export interface ReplyGateKey {
  artistId: number
  messageId: string
  senderId: number
}

// 답장 수신 게이트 — 답장 대상 말풍선(b:) 행을 앵커로 점조회(PK)하면서, 이 팬이 답장방(rb:)에
// 이미 보낸 답장 수(idx_chat_message_stream_sender seek)를 스칼라 서브쿼리로 함께 읽습니다
// (한 왕복). 원본 말풍선이 없으면 undefined.
export async function getReplyGate({ artistId, messageId, senderId }: ReplyGateKey): Promise<ReplyGate | undefined> {
  const replyStreamId = toMessageReplyStreamId(artistId, messageId)

  const ownReplyCount = sql<number>`(
    select count(*) from ${chatMessageTable}
    where ${chatMessageTable.streamId} = ${replyStreamId} and ${chatMessageTable.senderId} = ${senderId}
  )`.mapWith(Number)

  const [row] = await chatDB
    .select({ ownReplyCount })
    .from(chatMessageTable)
    .where(and(eq(chatMessageTable.streamId, toBroadcastStreamId(artistId)), eq(chatMessageTable.messageId, messageId)))

  return row
}

// messageId(ULID) 기준의 반열린 구간 [fromId, toIdExclusive). 시간 창을 messageId 범위로 변환할 때 씁니다.
export interface TimelineWindow {
  fromId: string
  toIdExclusive: string
}

export interface ListMessagesOptions {
  // windows가 주어지면 그 messageId 범위에 드는 말풍선만 포함합니다(예: 만료된 구독 팬은
  // 결제했던 기간에 발송된 브로드캐스트만). 빈 배열이면 결과 없음. 미지정이면 전체.
  windows?: TimelineWindow[]
  // 과거로 페이지 넘김: 이 id보다 더 오래된 말풍선만.
  before?: string
  // 미래로 페이지 넘김: 이 id보다 더 최신인 말풍선만.
  after?: string
  limit?: number
}

// 아티스트의 브로드캐스트(말풍선) 타임라인을 시간 순으로 읽어옵니다.
export async function listBroadcastMessages(
  artistId: number,
  options: ListMessagesOptions = {},
): Promise<ChatMessageRow[]> {
  const conditions = [eq(chatMessageTable.streamId, toBroadcastStreamId(artistId))]

  if (options.windows) {
    if (options.windows.length === 0) {
      return []
    }

    const windowConditions = options.windows.map((window) =>
      and(gte(chatMessageTable.messageId, window.fromId), lt(chatMessageTable.messageId, window.toIdExclusive)),
    )

    conditions.push(or(...windowConditions)!)
  }

  if (options.before) {
    conditions.push(lt(chatMessageTable.messageId, options.before))
  }

  if (options.after) {
    conditions.push(gt(chatMessageTable.messageId, options.after))
  }

  const isForwardSync = Boolean(options.after) && !options.before
  const order = isForwardSync ? asc(chatMessageTable.messageId) : desc(chatMessageTable.messageId)

  const rows = await chatDB
    .select()
    .from(chatMessageTable)
    .where(and(...conditions))
    .orderBy(order)
    .limit(clampPageSize(options.limit))

  if (isForwardSync) {
    rows.reverse()
  }

  return rows
}

export interface ListOwnRepliesInput {
  artistId: number
  fanId: number
  messageIds: string[]
}

// 한 팬이 주어진 말풍선들에 단 "자기 자신의" 답장들. 화면에 보이는 말풍선들에 인라인으로 붙이기 위해
// 페이지 단위(보통 ≤30개 messageId)로만 호출됩니다 → idx_chat_message_stream_sender 정확 seek.
export async function listOwnRepliesForMessages({
  artistId,
  fanId,
  messageIds,
}: ListOwnRepliesInput): Promise<ChatMessageRow[]> {
  if (messageIds.length === 0) {
    return []
  }

  const streamIds = messageIds.map((messageId) => toMessageReplyStreamId(artistId, messageId))

  return chatDB
    .select()
    .from(chatMessageTable)
    .where(and(inArray(chatMessageTable.streamId, streamIds), eq(chatMessageTable.senderId, fanId)))
    .orderBy(asc(chatMessageTable.messageId))
}

export interface HasOwnRepliesInput {
  senderId: number
  artistId: number
  window: TimelineWindow
}

// 한 팬이 한 아티스트의 답장방들에서 주어진 messageId 시간 창 안에 보낸 답장이 있는지 —
// 청약철회 조건("해당 결제 기간 답장 미발신") 판정용(idx_chat_message_sender_stream seek).
export async function hasOwnRepliesInWindow({ senderId, artistId, window }: HasOwnRepliesInput): Promise<boolean> {
  const range = messageReplyStreamRange(artistId)

  const [row] = await chatDB
    .select({ messageId: chatMessageTable.messageId })
    .from(chatMessageTable)
    .where(
      and(
        eq(chatMessageTable.senderId, senderId),
        gte(chatMessageTable.streamId, range.from),
        lt(chatMessageTable.streamId, range.toExclusive),
        gte(chatMessageTable.messageId, window.fromId),
        lt(chatMessageTable.messageId, window.toIdExclusive),
      ),
    )
    .limit(1)

  return row !== undefined
}

export interface ListRepliesOptions {
  before?: string
  limit?: number
}

// 한 말풍선의 답장방: 모든 팬의 답장(아티스트만 읽음). 최신순 keyset 페이지네이션.
export async function listMessageReplies(
  artistId: number,
  messageId: string,
  options: ListRepliesOptions = {},
): Promise<ChatMessageRow[]> {
  const conditions = [eq(chatMessageTable.streamId, toMessageReplyStreamId(artistId, messageId))]

  if (options.before) {
    conditions.push(lt(chatMessageTable.messageId, options.before))
  }

  return chatDB
    .select()
    .from(chatMessageTable)
    .where(and(...conditions))
    .orderBy(desc(chatMessageTable.messageId))
    .limit(clampPageSize(options.limit))
}
