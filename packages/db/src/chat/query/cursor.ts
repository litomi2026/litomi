import { and, count, eq, gt, inArray, isNull, ne, or, sql } from 'drizzle-orm'

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

export interface SetReadCursorInput {
  userId: number
  streamId: string
  lastReadMessageId: string
}

export async function setReadCursor({ userId, streamId, lastReadMessageId }: SetReadCursorInput): Promise<void> {
  await chatDB
    .insert(chatReadCursorTable)
    .values({ userId, streamId, lastReadMessageId })
    .onConflictDoUpdate({
      target: [chatReadCursorTable.userId, chatReadCursorTable.streamId],
      set: {
        // GREATEST로 과거의 읽기 요청이 늦게 도착해도 커서가 항상 앞으로만 전진하도록 보장합니다.
        lastReadMessageId: sql`GREATEST(${chatReadCursorTable.lastReadMessageId}, ${lastReadMessageId})`,
        updatedAt: new Date(),
      },
    })
}

export interface SetFanReadWatermarkInput {
  fanId: number
  artistId: number
  lastReadMessageId: string
}

// 팬의 브로드캐스트 읽음 워터마크는 대표 스트림인 공지방 ID(b:{artistId})에 저장합니다.
export function setFanReadWatermark({ fanId, artistId, lastReadMessageId }: SetFanReadWatermarkInput): Promise<void> {
  return setReadCursor({ userId: fanId, streamId: toBroadcastStreamId(artistId), lastReadMessageId })
}

// 여러 방의 안읽음 뱃지 숫자를 읽음 커서 조인까지 포함해 단 1번의 쿼리로 계산합니다(N+1 방지).
// 커서가 없는 방은 전체가 안읽음이고, 조회자 본인이 보낸 메시지는 세지 않습니다.
// 안읽음이 0인 스트림은 반환 Map에 포함되지 않습니다.
export async function countUnreadByStreams(userId: number, streamIds: string[]): Promise<Map<string, number>> {
  if (streamIds.length === 0) {
    return new Map()
  }

  const rows = await chatDB
    .select({
      streamId: chatMessageTable.streamId,
      unread: count(),
    })
    .from(chatMessageTable)
    .leftJoin(
      chatReadCursorTable,
      and(eq(chatReadCursorTable.userId, userId), eq(chatReadCursorTable.streamId, chatMessageTable.streamId)),
    )
    .where(
      and(
        inArray(chatMessageTable.streamId, streamIds),
        ne(chatMessageTable.senderId, userId),
        or(
          isNull(chatReadCursorTable.lastReadMessageId),
          gt(chatMessageTable.messageId, chatReadCursorTable.lastReadMessageId),
        ),
      ),
    )
    .groupBy(chatMessageTable.streamId)

  return new Map(rows.map((row) => [row.streamId, Number(row.unread)]))
}
