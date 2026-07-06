import { and, asc, eq, inArray, type SQL, sql } from 'drizzle-orm'

import { chatDB } from '../db'
import { chatDmMessageTable, chatReadCursorTable, chatReplyReadCursorTable } from '../schema'

const ERASE_BATCH_SIZE = 5000

export interface EraseChatUserInput {
  userId: number
}

// 탈퇴 파기 — 떠나는 사용자의 사적 데이터만 지운다. 1:1 대화는 값을 치른 팬의 사적 스레드이므로
// 그가 팬이었던 대화(fanId=user) 전체를 삭제한다: 상대의 되답장에도 팬 정보가 인용돼 있을 수
// 있어 절반만 지우면 파기권을 뚫는다. 반대로 아티스트 페르소나가 판매한 콘텐츠 — 브로드캐스트와
// 1:1 되답장 — 는 구독 팬이 값을 치른 것이라 남긴다(App DB에서 페르소나는 tombstone). 멱등.
export async function eraseChatUser({ userId }: EraseChatUserInput): Promise<void> {
  await eraseDmMessagesWhere(eq(chatDmMessageTable.fanId, userId))
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
