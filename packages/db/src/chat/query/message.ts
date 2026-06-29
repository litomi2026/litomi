import { and, asc, desc, eq, gt, gte, lt, or } from 'drizzle-orm'
import { encodeTime, ulid } from 'ulid'

import { chatDB } from '../db'
import { chatMessageTable } from '../schema'
import { clampPageSize } from './common'

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

// 메시지 id(ULID) 기준의 반열린 구간 [fromId, toIdExclusive). 시간 창을 messageId 범위로 변환할 때 씁니다.
export interface TimelineWindow {
  fromId: string
  toIdExclusive: string
}

// 타임라인을 구성하는 한 스트림. windows가 있으면 그 messageId 범위들만 포함합니다(예: 만료 구독 팬의
// 브로드캐스트는 결제했던 기간에 보낸 것만). windows가 없으면 스트림 전체를 포함합니다.
export interface TimelineStream {
  streamId: string
  windows?: TimelineWindow[]
}

export interface ListMessagesOptions {
  limit?: number
  // 과거 시간으로 페이지 넘김: 이 id보다 정확히 더 오래된 메시지만 가져옵니다.
  before?: string
  // 미래 시간으로 페이지 넘김: 이 id보다 정확히 더 최신인 메시지만 가져옵니다.
  after?: string
}

// 여러 스트림(+선택적 시간 창)을 시간 순으로 정렬된 단일 타임라인으로 읽어옵니다.
// 팬이 특정 크리에이터의 대화방을 볼 때 브로드캐스트 스트림과 본인의 1:1 대화(reply) 스트림을 병합해서 보게 되는데,
// messageId가 ULID 형식이므로 단순히 messageId만으로 정렬해도 여러 스트림 간의 전역적인 시간 순서가 자연스럽게 보장됩니다.
export async function listTimelineMessages(
  streams: TimelineStream[],
  options: ListMessagesOptions = {},
): Promise<ChatMessageRow[]> {
  const streamPredicates = streams.flatMap((stream) => {
    const matchesStream = eq(chatMessageTable.streamId, stream.streamId)

    if (!stream.windows) {
      return [matchesStream]
    }
    if (stream.windows.length === 0) {
      return []
    }

    const inAnyWindow = or(
      ...stream.windows.map((window) =>
        and(gte(chatMessageTable.messageId, window.fromId), lt(chatMessageTable.messageId, window.toIdExclusive)),
      ),
    )

    return [and(matchesStream, inAnyWindow)]
  })

  if (streamPredicates.length === 0) {
    return []
  }

  const conditions = [or(...streamPredicates)!]

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
