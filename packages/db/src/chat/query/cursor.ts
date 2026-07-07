import { and, count, eq, gt, inArray, isNull, or, sql } from 'drizzle-orm'

import { chatDB } from '../db'
import { chatBroadcastTable, chatDmMessageTable, chatReadCursorTable, chatReplyReadCursorTable } from '../schema'
import { type ArtistBroadcastWindows, broadcastWindowsFilter } from './message'

export interface FanWatermarkInput {
  fanId: number
  artistId: number
  lastReadMessageId: string
}

// 팬의 통합 타임라인 읽음 워터마크를 전진시킨다. GREATEST로 늦게 도착한 과거 요청이 커서를
// 뒤로 돌리지 못하게 항상 앞으로만 전진시킨다.
export async function setFanWatermark({ fanId, artistId, lastReadMessageId }: FanWatermarkInput): Promise<void> {
  await chatDB
    .insert(chatReadCursorTable)
    .values({ userId: fanId, artistId, lastReadMessageId })
    .onConflictDoUpdate({
      target: [chatReadCursorTable.userId, chatReadCursorTable.artistId],
      set: {
        lastReadMessageId: sql`GREATEST(${chatReadCursorTable.lastReadMessageId}, ${lastReadMessageId})`,
        updatedAt: new Date(),
      },
    })
}

export interface ReplyRoomWatermarkInput {
  artistUserId: number
  artistId: number
  messageId: string
  lastReadMessageId: string
}

// 아티스트의 한 말풍선 답장방 읽음 워터마크(오너 userId 기준).
export async function setReplyRoomWatermark({
  artistUserId,
  artistId,
  messageId,
  lastReadMessageId,
}: ReplyRoomWatermarkInput): Promise<void> {
  await chatDB
    .insert(chatReplyReadCursorTable)
    .values({ userId: artistUserId, artistId, contextMessageId: messageId, lastReadMessageId })
    .onConflictDoUpdate({
      target: [
        chatReplyReadCursorTable.userId,
        chatReplyReadCursorTable.artistId,
        chatReplyReadCursorTable.contextMessageId,
      ],
      set: {
        lastReadMessageId: sql`GREATEST(${chatReplyReadCursorTable.lastReadMessageId}, ${lastReadMessageId})`,
        updatedAt: new Date(),
      },
    })
}

export interface GetReplyRoomWatermarksInput {
  artistUserId: number
  artistId: number
  contextMessageIds: string[]
}

// 아티스트의 말풍선별 답장방 워터마크를 읽는다 — 팬 타임라인에 room-level 읽음 표시를
// 내려주기 위한 읽기축. contextMessageId → lastReadMessageId. 커서 없는 방은 Map에서 빠진다.
export async function getReplyRoomWatermarks({
  artistUserId,
  artistId,
  contextMessageIds,
}: GetReplyRoomWatermarksInput): Promise<Map<string, string>> {
  if (contextMessageIds.length === 0) {
    return new Map()
  }

  const rows = await chatDB
    .select({
      contextMessageId: chatReplyReadCursorTable.contextMessageId,
      lastReadMessageId: chatReplyReadCursorTable.lastReadMessageId,
    })
    .from(chatReplyReadCursorTable)
    .where(
      and(
        eq(chatReplyReadCursorTable.userId, artistUserId),
        eq(chatReplyReadCursorTable.artistId, artistId),
        inArray(chatReplyReadCursorTable.contextMessageId, contextMessageIds),
      ),
    )

  return new Map(rows.map((row) => [row.contextMessageId, row.lastReadMessageId]))
}

// 팬의 아티스트별 브로드캐스트 안읽음 수 — 결제 창 안 방송만 센다(타임라인 열람 범위와 일치).
// 커서 조인까지 한 쿼리로(N+1 방지). 커서 없는 방은 창 안 전체가 안읽음. 방송은 항상 아티스트
// 발신이므로 자기 메시지 제외 불필요. 0인/열람 창 없는 아티스트는 Map 제외.
export async function countBroadcastUnread(
  fanId: number,
  entries: ArtistBroadcastWindows[],
): Promise<Map<number, number>> {
  const windowFilter = broadcastWindowsFilter(entries)

  if (!windowFilter) {
    return new Map()
  }

  const rows = await chatDB
    .select({ artistId: chatBroadcastTable.artistId, unread: count() })
    .from(chatBroadcastTable)
    .leftJoin(
      chatReadCursorTable,
      and(eq(chatReadCursorTable.userId, fanId), eq(chatReadCursorTable.artistId, chatBroadcastTable.artistId)),
    )
    .where(
      and(
        windowFilter,
        or(
          isNull(chatReadCursorTable.lastReadMessageId),
          gt(chatBroadcastTable.messageId, chatReadCursorTable.lastReadMessageId),
        ),
      ),
    )
    .groupBy(chatBroadcastTable.artistId)

  return new Map(rows.map((row) => [row.artistId, Number(row.unread)]))
}

// 팬의 아티스트별 1:1 안읽음 수 — 아티스트가 이 팬에게 보낸(senderRole='artist') 답장만 센다.
// 팬 통합 커서(chatReadCursorTable)를 그대로 재사용한다(방송과 같은 읽음 위치).
export async function countDmUnread(fanId: number, artistIds: number[]): Promise<Map<number, number>> {
  if (artistIds.length === 0) {
    return new Map()
  }

  const rows = await chatDB
    .select({ artistId: chatDmMessageTable.artistId, unread: count() })
    .from(chatDmMessageTable)
    .leftJoin(
      chatReadCursorTable,
      and(eq(chatReadCursorTable.userId, fanId), eq(chatReadCursorTable.artistId, chatDmMessageTable.artistId)),
    )
    .where(
      and(
        inArray(chatDmMessageTable.artistId, artistIds),
        eq(chatDmMessageTable.fanId, fanId),
        eq(chatDmMessageTable.senderRole, 'artist'),
        or(
          isNull(chatReadCursorTable.lastReadMessageId),
          gt(chatDmMessageTable.messageId, chatReadCursorTable.lastReadMessageId),
        ),
      ),
    )
    .groupBy(chatDmMessageTable.artistId)

  return new Map(rows.map((row) => [row.artistId, Number(row.unread)]))
}

// 아티스트의 말풍선별 답장방 안읽음 수 — 새 팬 답장(senderRole='fan')만 센다(오너 커서 기준).
export async function countReplyRoomUnread(
  artistUserId: number,
  artistId: number,
  contextMessageIds: string[],
): Promise<Map<string, number>> {
  if (contextMessageIds.length === 0) {
    return new Map()
  }

  const rows = await chatDB
    .select({ contextMessageId: chatDmMessageTable.contextMessageId, unread: count() })
    .from(chatDmMessageTable)
    .leftJoin(
      chatReplyReadCursorTable,
      and(
        eq(chatReplyReadCursorTable.userId, artistUserId),
        eq(chatReplyReadCursorTable.artistId, chatDmMessageTable.artistId),
        eq(chatReplyReadCursorTable.contextMessageId, chatDmMessageTable.contextMessageId),
      ),
    )
    .where(
      and(
        eq(chatDmMessageTable.artistId, artistId),
        inArray(chatDmMessageTable.contextMessageId, contextMessageIds),
        eq(chatDmMessageTable.senderRole, 'fan'),
        or(
          isNull(chatReplyReadCursorTable.lastReadMessageId),
          gt(chatDmMessageTable.messageId, chatReplyReadCursorTable.lastReadMessageId),
        ),
      ),
    )
    .groupBy(chatDmMessageTable.contextMessageId)

  return new Map(rows.map((row) => [row.contextMessageId, Number(row.unread)]))
}
