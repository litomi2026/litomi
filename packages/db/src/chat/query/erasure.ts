import { and, asc, eq, inArray, ne, type SQL, sql } from 'drizzle-orm'

import { chatDB } from '../db'
import { chatMessageTable, chatReadCursorTable } from '../schema'
import { toBroadcastStreamId } from './stream'

const ERASE_BATCH_SIZE = 5000

export interface EraseChatUserInput {
  userId: number
  ownedArtistId: number | null
}

export async function eraseChatUser({ userId, ownedArtistId }: EraseChatUserInput): Promise<void> {
  const conditions = [eq(chatMessageTable.senderId, userId)]

  if (ownedArtistId !== null) {
    conditions.push(ne(chatMessageTable.streamId, toBroadcastStreamId(ownedArtistId)))
  }

  await eraseMessagesWhere(and(...conditions)!)
  await chatDB.delete(chatReadCursorTable).where(eq(chatReadCursorTable.userId, userId))
}

interface MessageKey {
  streamId: string
  messageId: string
}

async function eraseMessagesWhere(condition: SQL): Promise<void> {
  let cursor: MessageKey | null = null
  const messageKeyTuple = sql`(${chatMessageTable.streamId}, ${chatMessageTable.messageId})`

  while (true) {
    // 서브셀렉트가 커서 다음 키에서 시작하므로 이전 배치의 톰스톤 구간을 다시 읽지 않는다.
    const batch = chatDB
      .select({ streamId: chatMessageTable.streamId, messageId: chatMessageTable.messageId })
      .from(chatMessageTable)
      .where(cursor ? and(condition, sql`${messageKeyTuple} > (${cursor.streamId}, ${cursor.messageId})`) : condition)
      .orderBy(asc(chatMessageTable.streamId), asc(chatMessageTable.messageId))
      .limit(ERASE_BATCH_SIZE)

    const deleted = await chatDB
      .delete(chatMessageTable)
      .where(inArray(messageKeyTuple, batch))
      .returning({ streamId: chatMessageTable.streamId, messageId: chatMessageTable.messageId })

    if (deleted.length < ERASE_BATCH_SIZE) {
      return
    }

    // RETURNING은 순서를 보장하지 않으므로 다음 커서(이번 배치의 최대 키)는 직접 고른다.
    for (const key of deleted) {
      if (isAfterCursor(key, cursor)) {
        cursor = key
      }
    }
  }
}

function isAfterCursor(key: MessageKey, cursor: MessageKey | null): boolean {
  if (cursor === null) {
    return true
  }

  if (key.streamId !== cursor.streamId) {
    return key.streamId > cursor.streamId
  }

  return key.messageId > cursor.messageId
}
