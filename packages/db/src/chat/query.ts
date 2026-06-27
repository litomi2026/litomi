import { and, asc, desc, eq, gt, lt, sql } from 'drizzle-orm'
import { ulid } from 'ulid'

import { chatDB } from './db'
import { chatMessageTable, chatReadCursorTable } from './schema'

export type ChatMessageKind = 'broadcast' | 'reply'
export type ChatMessageRow = typeof chatMessageTable.$inferSelect

const DEFAULT_PAGE_SIZE = 30
const MAX_PAGE_SIZE = 100

// 크리에이터가 자신의 모든 팬들에게 일방향으로 보내는 "공지방(Broadcast)"의 고유 ID를 만듭니다.
export function broadcastStreamId(creatorId: number): string {
  return `b:${creatorId}`
}

// 크리에이터와 특정 팬 한 명이 주고받는 "1:1 개인톡(Reply)" 방의 고유 ID를 만듭니다.
export function replyStreamId(creatorId: number, fanId: number): string {
  return `r:${creatorId}:${fanId}`
}

export function getKindFromStreamId(streamId: string): ChatMessageKind {
  return streamId.startsWith('b:') ? 'broadcast' : 'reply'
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

export interface ListMessagesOptions {
  limit?: number
  // Page backwards in time: only messages strictly older than this id.
  before?: string
  // Page forwards in time: only messages strictly newer than this id.
  after?: string
}

export async function listChatMessages(streamId: string, options: ListMessagesOptions = {}): Promise<ChatMessageRow[]> {
  const conditions = [eq(chatMessageTable.streamId, streamId)]

  if (options.before) {
    conditions.push(lt(chatMessageTable.messageId, options.before))
  }
  if (options.after) {
    conditions.push(gt(chatMessageTable.messageId, options.after))
  }

  const isForwardSync = options.after && !options.before
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

export async function getReadCursor(userId: number, streamId: string): Promise<string | null> {
  const [row] = await chatDB
    .select({ lastReadMessageId: chatReadCursorTable.lastReadMessageId })
    .from(chatReadCursorTable)
    .where(and(eq(chatReadCursorTable.userId, userId), eq(chatReadCursorTable.streamId, streamId)))

  return row?.lastReadMessageId ?? null
}

export async function setReadCursor(userId: number, streamId: string, lastReadMessageId: string): Promise<void> {
  await chatDB
    .insert(chatReadCursorTable)
    .values({ userId, streamId, lastReadMessageId, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [chatReadCursorTable.userId, chatReadCursorTable.streamId],
      set: {
        // GREATEST ensures the cursor only moves forward even if an older read request arrives late.
        lastReadMessageId: sql`GREATEST(${chatReadCursorTable.lastReadMessageId}, ${lastReadMessageId})`,
        updatedAt: new Date(),
      },
    })
}

export async function countUnread(streamId: string, sinceMessageId: string | null): Promise<number> {
  const where = sinceMessageId
    ? and(eq(chatMessageTable.streamId, streamId), gt(chatMessageTable.messageId, sinceMessageId))
    : eq(chatMessageTable.streamId, streamId)

  const rows = await chatDB
    .select({ dummy: sql<number>`1` })
    .from(chatMessageTable)
    .where(where)
    // The UI can cap the display at "999+" or "1000+".
    .limit(1000)

  return rows.length
}

function clampPageSize(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_PAGE_SIZE
  }
  return Math.min(Math.max(Math.trunc(limit), 1), MAX_PAGE_SIZE)
}
