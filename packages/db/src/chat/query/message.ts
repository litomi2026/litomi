import { and, asc, desc, eq, gt, inArray, lt } from 'drizzle-orm'
import { ulid } from 'ulid'

import { chatDB } from '../db'
import { chatMessageTable } from '../schema'
import { clampPageSize } from './common'

export type ChatMessageRow = typeof chatMessageTable.$inferSelect

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
  // 과거 시간으로 페이지 넘김: 이 id보다 정확히 더 오래된 메시지만 가져옵니다.
  before?: string
  // 미래 시간으로 페이지 넘김: 이 id보다 정확히 더 최신인 메시지만 가져옵니다.
  after?: string
}

// 하나 이상의 스트림을 시간 순으로 정렬된 단일 타임라인으로 읽어옵니다.
// 팬이 특정 크리에이터의 대화방을 볼 때 브로드캐스트 스트림과 본인의 1:1 대화(reply) 스트림을 병합해서 보게 되는데,
// messageId가 ULID 형식이므로 단순히 messageId만으로 정렬해도 여러 스트림 간의 전역적인 시간 순서가 자연스럽게 보장됩니다.
export async function listStreamMessages(
  streamIds: string[],
  options: ListMessagesOptions = {},
): Promise<ChatMessageRow[]> {
  if (streamIds.length === 0) {
    return []
  }

  const conditions = [
    streamIds.length === 1
      ? eq(chatMessageTable.streamId, streamIds[0]!)
      : inArray(chatMessageTable.streamId, streamIds),
  ]

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

export function listChatMessages(streamId: string, options: ListMessagesOptions = {}): Promise<ChatMessageRow[]> {
  return listStreamMessages([streamId], options)
}
