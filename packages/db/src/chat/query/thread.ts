import { inArray, sql } from 'drizzle-orm'

import { chatDB } from '../db'
import { chatThreadTable } from '../schema'

export type ChatThreadRow = typeof chatThreadTable.$inferSelect

export interface ChatThreadSummaryInput {
  // 'b:{artistId}'
  streamId: string
  lastMessageId: string
  lastSenderId: number
  lastContentType: string
  lastPreview: string
  lastCreatedAt: Date
}

// 브로드캐스트 메시지가 저장될 때마다 워커에 의해 호출됩니다. 멱등성(Idempotent)과 순서를 보장합니다:
// `setWhere`로 정확히 더 최신인 messageId일 때만 갱신되므로, Kafka 재시도나 순서 뒤바뀐 전송이
// 발생해도 요약이 과거로 되돌아가지 않습니다.
export async function upsertChatThread(input: ChatThreadSummaryInput): Promise<void> {
  await chatDB
    .insert(chatThreadTable)
    .values({ ...input, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: chatThreadTable.streamId,
      set: {
        lastMessageId: sql.raw(`excluded.${chatThreadTable.lastMessageId.name}`),
        lastSenderId: sql.raw(`excluded.${chatThreadTable.lastSenderId.name}`),
        lastContentType: sql.raw(`excluded.${chatThreadTable.lastContentType.name}`),
        lastPreview: sql.raw(`excluded.${chatThreadTable.lastPreview.name}`),
        lastCreatedAt: sql.raw(`excluded.${chatThreadTable.lastCreatedAt.name}`),
        updatedAt: sql.raw(`excluded.${chatThreadTable.updatedAt.name}`),
      },
      setWhere: sql`${sql.raw(`excluded.${chatThreadTable.lastMessageId.name}`)} > ${chatThreadTable.lastMessageId}`,
    })
}

export async function getThreadSummaries(streamIds: string[]): Promise<Map<string, ChatThreadRow>> {
  if (streamIds.length === 0) {
    return new Map()
  }

  const rows = await chatDB.select().from(chatThreadTable).where(inArray(chatThreadTable.streamId, streamIds))

  return new Map(rows.map((row) => [row.streamId, row]))
}
