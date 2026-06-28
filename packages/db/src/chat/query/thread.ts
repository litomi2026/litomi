import { and, desc, eq, inArray, isNotNull, lt, sql } from 'drizzle-orm'

import { chatDB } from '../db'
import { chatThreadTable } from '../schema'
import { clampPageSize } from './common'

export type ChatThreadRow = typeof chatThreadTable.$inferSelect

export interface ChatThreadSummaryInput {
  streamId: string
  creatorId: number
  fanId: number | null
  lastMessageId: string
  lastSenderId: number
  lastContentType: string
  lastPreview: string
  lastCreatedAt: Date
}

// 메시지가 저장될 때마다 워커에 의해 호출됩니다. 멱등성(Idempotent)과 순서를 보장합니다:
// `setWhere` 구문을 통해 정확히 더 최신인 messageId만 행을 갱신할 수 있도록 제한하므로,
// Kafka의 재시도나 순서가 뒤바뀐 전송(out-of-order)이 발생해도 요약 데이터가 과거로 되돌아가는 일은 절대 발생하지 않습니다.
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

export interface ListInboxOptions {
  // 키셋 커서(Keyset cursor): 이전 페이지의 마지막 행에 있는 lastMessageId 값입니다.
  before?: string
  limit?: number
}

// 크리에이터의 인박스: 크리에이터의 1:1 대화(reply) 스레드들(팬당 1개)을 가장 최근에 활성화된 순서대로 가져옵니다.
export async function listInboxThreads(creatorId: number, options: ListInboxOptions = {}): Promise<ChatThreadRow[]> {
  const conditions = [eq(chatThreadTable.creatorId, creatorId), isNotNull(chatThreadTable.fanId)]

  if (options.before) {
    conditions.push(lt(chatThreadTable.lastMessageId, options.before))
  }

  return chatDB
    .select()
    .from(chatThreadTable)
    .where(and(...conditions))
    .orderBy(desc(chatThreadTable.lastMessageId))
    .limit(clampPageSize(options.limit))
}

// 팬이 참여한 1:1 대화(reply) 스레드들(크리에이터당 1개)을 최신순으로 가져옵니다.
// 각 행은 그 자체로 해당 r-스트림의 요약본이기도 합니다. (r:{C}:{fan}은 크리에이터당 유일하므로 크리에이터별 1행)
export async function listFanReplyThreads(fanId: number, limit = 200): Promise<ChatThreadRow[]> {
  return chatDB
    .select()
    .from(chatThreadTable)
    .where(eq(chatThreadTable.fanId, fanId))
    .orderBy(desc(chatThreadTable.lastMessageId))
    .limit(limit)
}
