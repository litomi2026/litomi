import { and, count, eq, gt, inArray, ne, or, sql } from 'drizzle-orm'

import { chatDB } from '../db'
import { chatMessageTable, chatReadCursorTable } from '../schema'
import { toBroadcastStreamId } from './stream'

// 한 사용자가 참여 중인 여러 스트림의 읽음 커서를 일괄 조회합니다.
// 한 번도 읽지 않은 스트림은 반환되는 Map에 아예 포함되지 않습니다.
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

export async function setReadCursor(userId: number, streamId: string, lastReadMessageId: string): Promise<void> {
  await chatDB
    .insert(chatReadCursorTable)
    .values({ userId, streamId, lastReadMessageId, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [chatReadCursorTable.userId, chatReadCursorTable.streamId],
      set: {
        // GREATEST로 과거의 읽기 요청이 늦게 도착해도 커서가 항상 앞으로만 전진하도록 보장합니다.
        lastReadMessageId: sql`GREATEST(${chatReadCursorTable.lastReadMessageId}, ${lastReadMessageId})`,
        updatedAt: new Date(),
      },
    })
}

// 팬의 브로드캐스트 읽음 워터마크는 대표 스트림인 공지방 ID(b:{creatorId})에 저장합니다.
export function setFanReadWatermark(fanId: number, creatorId: number, lastReadMessageId: string): Promise<void> {
  return setReadCursor(fanId, toBroadcastStreamId(creatorId), lastReadMessageId)
}

export interface UnreadFilter {
  streamId: string
  sinceMessageId?: string | null
  // 조회자 본인이 보낸 메시지는 안읽음 카운트에서 제외합니다.
  excludeSenderId?: number
}

// 여러 방의 안읽음 뱃지 숫자를 단 1번의 쿼리(OR & GROUP BY)로 계산하여 N+1을 방지합니다.
// 안읽음이 0인 스트림은 반환 Map에 포함되지 않습니다.
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
