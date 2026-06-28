import { and, count, eq, gt, inArray, ne, or, sql } from 'drizzle-orm'

import { chatDB } from '../db'
import { chatMessageTable, chatReadCursorTable } from '../schema'
import { broadcastStreamId } from './stream'

export async function getReadCursor(userId: number, streamId: string): Promise<string | null> {
  const [row] = await chatDB
    .select({ lastReadMessageId: chatReadCursorTable.lastReadMessageId })
    .from(chatReadCursorTable)
    .where(and(eq(chatReadCursorTable.userId, userId), eq(chatReadCursorTable.streamId, streamId)))

  return row?.lastReadMessageId ?? null
}

// 한 사용자가 참여 중인 여러 스트림(채팅 목록 / 인박스)의 읽음 커서를 일괄 조회합니다.
// 사용자가 한 번도 읽지 않은 스트림은 반환되는 Map에 아예 포함되지 않습니다.
export async function getReadCursors(userId: number, streamIds: string[]): Promise<Map<string, string>> {
  if (streamIds.length === 0) {
    return new Map()
  }

  const rows = await chatDB
    .select({
      streamId: chatReadCursorTable.streamId,
      lastReadMessageId: chatReadCursorTable.lastReadMessageId,
    })
    .from(chatReadCursorTable)
    .where(and(eq(chatReadCursorTable.userId, userId), inArray(chatReadCursorTable.streamId, streamIds)))

  return new Map(rows.map((row) => [row.streamId, row.lastReadMessageId]))
}

// 팬의 화면에서는 공지방(Broadcast)과 1:1 대화방(Reply)이 하나의 타임라인으로 합쳐져서 보입니다.
// 따라서 읽음 처리(책갈피)를 두 방에 따로 할 필요 없이, 대표로 '공지방 ID'에만
// 단일 워터마크(마지막으로 읽은 메시지 ID)를 저장하고 두 방의 안읽음 상태를 한꺼번에 계산합니다.
export function getFanReadWatermark(fanId: number, creatorId: number): Promise<string | null> {
  return getReadCursor(fanId, broadcastStreamId(creatorId))
}

export function setFanReadWatermark(fanId: number, creatorId: number, lastReadMessageId: string): Promise<void> {
  return setReadCursor(fanId, broadcastStreamId(creatorId), lastReadMessageId)
}

export async function setReadCursor(userId: number, streamId: string, lastReadMessageId: string): Promise<void> {
  await chatDB
    .insert(chatReadCursorTable)
    .values({ userId, streamId, lastReadMessageId, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [chatReadCursorTable.userId, chatReadCursorTable.streamId],
      set: {
        // GREATEST 함수를 사용하여 과거의 읽기 요청이 네트워크 지연 등으로 늦게 도착하더라도 커서가 항상 앞으로만 전진하도록 보장합니다.
        lastReadMessageId: sql`GREATEST(${chatReadCursorTable.lastReadMessageId}, ${lastReadMessageId})`,
        updatedAt: new Date(),
      },
    })
}

export interface CountUnreadOptions {
  // 조회자 본인이 보낸 메시지는 안읽음 카운트에 포함하지 않습니다.
  excludeSenderId?: number
}

export async function countUnread(
  streamId: string,
  sinceMessageId: string | null,
  options: CountUnreadOptions = {},
): Promise<number> {
  const conditions = [eq(chatMessageTable.streamId, streamId)]

  if (sinceMessageId) {
    conditions.push(gt(chatMessageTable.messageId, sinceMessageId))
  }

  if (options.excludeSenderId !== undefined) {
    conditions.push(ne(chatMessageTable.senderId, options.excludeSenderId))
  }

  const rows = await chatDB
    .select({ dummy: sql<number>`1` })
    .from(chatMessageTable)
    .where(and(...conditions))
    // UI에서 "999+" 형태로 표시할 수 있도록 최대 1000개까지만 제한하여 카운트합니다.
    .limit(1000)

  return rows.length
}

export interface UnreadFilter {
  streamId: string
  sinceMessageId: string | null
  excludeSenderId?: number
}

// 채팅 목록(Inbox) 화면을 위해 여러 방의 안읽음 뱃지 숫자를 단 1번의 쿼리(OR & GROUP BY)로 한꺼번에 계산하여 N+1 쿼리 문제를 방지합니다.
// (단일 방을 조회하는 countUnread 함수와 달리 LIMIT 1000 제한을 걸 수 없으므로 모든 개수를 끝까지 셉니다)
// 안읽음 메시지가 0개인 스트림은 반환되는 Map에 포함되지 않아 불필요한 메모리 낭비를 막습니다.
export async function countUnreadByStreams(filters: UnreadFilter[]): Promise<Map<string, number>> {
  if (filters.length === 0) {
    return new Map()
  }

  const predicates = filters.map((filter) => {
    const conditions = [eq(chatMessageTable.streamId, filter.streamId)]

    if (filter.sinceMessageId) {
      conditions.push(gt(chatMessageTable.messageId, filter.sinceMessageId))
    }

    if (filter.excludeSenderId !== undefined) {
      conditions.push(ne(chatMessageTable.senderId, filter.excludeSenderId))
    }

    return and(...conditions)
  })

  const rows = await chatDB
    .select({
      streamId: chatMessageTable.streamId,
      unread: count(),
    })
    .from(chatMessageTable)
    .where(or(...predicates))
    .groupBy(chatMessageTable.streamId)

  return new Map(rows.map((row) => [row.streamId, Number(row.unread)]))
}
