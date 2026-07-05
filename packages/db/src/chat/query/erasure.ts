import { and, asc, eq, inArray, or, type SQL, sql } from 'drizzle-orm'

import { chatDB } from '../db'
import { chatDmMessageTable, chatReadCursorTable, chatReplyReadCursorTable } from '../schema'

const ERASE_BATCH_SIZE = 5000

export interface EraseChatUserInput {
  userId: number
  ownedArtistId: number | null
}

// 탈퇴 파기 — 사용자의 사적 데이터를 지운다. 1:1 대화는 두 당사자가 공동 소유하므로 어느 한쪽이
// 탈퇴하면 그 대화 전체를 삭제한다(dangling id 없음): 팬으로서의 대화(fanId=user)와, 아티스트
// 였다면 그 페르소나의 모든 1:1 대화(artistId=owned)를 함께 지운다. 브로드캐스트(chat_broadcast)는
// "판매된 메시지 열람 보존" 정책에 따라 남긴다(App DB에서 페르소나는 tombstone). 모든 삭제는 멱등.
export async function eraseChatUser({ userId, ownedArtistId }: EraseChatUserInput): Promise<void> {
  const conditions = [eq(chatDmMessageTable.fanId, userId)]

  if (ownedArtistId !== null) {
    conditions.push(eq(chatDmMessageTable.artistId, ownedArtistId))
  }

  await eraseDmMessagesWhere(or(...conditions)!)
  await chatDB.delete(chatReadCursorTable).where(eq(chatReadCursorTable.userId, userId))
  await chatDB.delete(chatReplyReadCursorTable).where(eq(chatReplyReadCursorTable.userId, userId))
}

interface DmMessageKey {
  artistId: number
  fanId: number
  messageId: string
}

async function eraseDmMessagesWhere(condition: SQL): Promise<void> {
  let cursor: DmMessageKey | null = null
  const keyTuple = sql`(${chatDmMessageTable.artistId}, ${chatDmMessageTable.fanId}, ${chatDmMessageTable.messageId})`

  while (true) {
    // 서브셀렉트가 커서 다음 키에서 시작하므로 이전 배치의 톰스톤 구간을 다시 읽지 않는다.
    const batch = chatDB
      .select({
        artistId: chatDmMessageTable.artistId,
        fanId: chatDmMessageTable.fanId,
        messageId: chatDmMessageTable.messageId,
      })
      .from(chatDmMessageTable)
      .where(
        cursor
          ? and(condition, sql`${keyTuple} > (${cursor.artistId}, ${cursor.fanId}, ${cursor.messageId})`)
          : condition,
      )
      .orderBy(asc(chatDmMessageTable.artistId), asc(chatDmMessageTable.fanId), asc(chatDmMessageTable.messageId))
      .limit(ERASE_BATCH_SIZE)

    const deleted = await chatDB.delete(chatDmMessageTable).where(inArray(keyTuple, batch)).returning({
      artistId: chatDmMessageTable.artistId,
      fanId: chatDmMessageTable.fanId,
      messageId: chatDmMessageTable.messageId,
    })

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

function isAfterCursor(key: DmMessageKey, cursor: DmMessageKey | null): boolean {
  if (cursor === null) {
    return true
  }

  if (key.artistId !== cursor.artistId) {
    return key.artistId > cursor.artistId
  }

  if (key.fanId !== cursor.fanId) {
    return key.fanId > cursor.fanId
  }

  return key.messageId > cursor.messageId
}
