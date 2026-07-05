import { inArray, lt } from 'drizzle-orm'

import { chatDB } from '../db'
import { chatBroadcastSummaryTable } from '../schema'

export type ChatBroadcastSummaryRow = typeof chatBroadcastSummaryTable.$inferSelect

export interface UpsertBroadcastSummaryInput {
  artistId: number
  lastMessageId: string
  lastPreview: string
  lastCreatedAt: Date
}

// 아티스트별 최신 브로드캐스트 요약을 갱신한다. setWhere로 더 오래된 말풍선이 최신 요약을
// 밀어내지 못하게(늦게 도착한 이벤트에도 요약이 앞으로만 전진) 보장한다.
export async function upsertBroadcastSummary(input: UpsertBroadcastSummaryInput): Promise<void> {
  const now = new Date()

  await chatDB
    .insert(chatBroadcastSummaryTable)
    .values({ ...input, updatedAt: now })
    .onConflictDoUpdate({
      target: chatBroadcastSummaryTable.artistId,
      set: {
        lastMessageId: input.lastMessageId,
        lastPreview: input.lastPreview,
        lastCreatedAt: input.lastCreatedAt,
        updatedAt: now,
      },
      setWhere: lt(chatBroadcastSummaryTable.lastMessageId, input.lastMessageId),
    })
}

export async function getBroadcastSummaries(artistIds: number[]): Promise<Map<number, ChatBroadcastSummaryRow>> {
  if (artistIds.length === 0) {
    return new Map()
  }

  const rows = await chatDB
    .select()
    .from(chatBroadcastSummaryTable)
    .where(inArray(chatBroadcastSummaryTable.artistId, artistIds))

  return new Map(rows.map((row) => [row.artistId, row]))
}
