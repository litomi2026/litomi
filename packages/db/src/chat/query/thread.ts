import { inArray, lt } from 'drizzle-orm'

import { chatDB } from '../db'
import { chatThreadTable } from '../schema'

export type ChatThreadRow = typeof chatThreadTable.$inferSelect

export interface ChatThreadSummaryInput {
  streamId: string
  lastMessageId: string
  lastSenderId: number
  lastContentType: string
  lastPreview: string
  lastCreatedAt: Date
}

export async function upsertChatThread(input: ChatThreadSummaryInput): Promise<void> {
  const now = new Date()

  await chatDB
    .insert(chatThreadTable)
    .values({ ...input, updatedAt: now })
    .onConflictDoUpdate({
      target: chatThreadTable.streamId,
      set: {
        lastMessageId: input.lastMessageId,
        lastSenderId: input.lastSenderId,
        lastContentType: input.lastContentType,
        lastPreview: input.lastPreview,
        lastCreatedAt: input.lastCreatedAt,
        updatedAt: now,
      },
      setWhere: lt(chatThreadTable.lastMessageId, input.lastMessageId),
    })
}

export async function getThreadSummaries(streamIds: string[]): Promise<Map<string, ChatThreadRow>> {
  if (streamIds.length === 0) {
    return new Map()
  }

  const rows = await chatDB.select().from(chatThreadTable).where(inArray(chatThreadTable.streamId, streamIds))

  return new Map(rows.map((row) => [row.streamId, row]))
}
