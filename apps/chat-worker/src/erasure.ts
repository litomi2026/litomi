import { deleteUserErasure, listUserErasures } from '@litomi/db/app/query/user-erasure'
import { eraseChatUser } from '@litomi/db/chat/query'

const POLL_INTERVAL_MS = 60_000
const POLL_BATCH_SIZE = 10

// 탈퇴 파기 폴러 — App DB의 user_erasure outbox를 주기적으로 읽어 Chat DB(별도 클러스터,
// FK/cascade 불가)에서 해당 사용자의 데이터를 지웁니다. 파기가 전부 끝난 뒤에만 outbox 행을
// 제거하므로 실패 건은 다음 폴링에서 자동 재시도됩니다(모든 삭제는 멱등).
export function startErasureLoop(): { stop: () => void } {
  let running = false

  const tick = async () => {
    if (running) {
      return
    }

    running = true
    try {
      await processErasures()
    } catch (error) {
      console.error('chat-worker: erasure pass failed', error)
    } finally {
      running = false
    }
  }

  tick()
  const timer = setInterval(() => void tick(), POLL_INTERVAL_MS)

  return { stop: () => clearInterval(timer) }
}

async function processErasures(): Promise<void> {
  while (true) {
    const rows = await listUserErasures(POLL_BATCH_SIZE)
    let failed = false

    for (const row of rows) {
      try {
        // 아티스트였다면 본인 브로드캐스트는 남긴다(판매된 메시지 열람 보존 정책) —
        // 페르소나 행도 App DB에서 tombstone(userId null)으로 살아 있다.
        await eraseChatUser({
          userId: row.userId,
          ownedArtistId: row.chatArtistId,
        })

        await deleteUserErasure(row.userId)

        console.info('chat-worker: erased chat data', {
          userId: row.userId,
          chatArtistId: row.chatArtistId,
        })
      } catch (error) {
        // 이 행은 outbox에 남아 다음 틱에 재시도된다 — 배치 루프만 멈추고 폴러는 계속 돈다.
        failed = true

        console.error('chat-worker: erase failed', {
          userId: row.userId,
          error,
        })
      }
    }

    if (failed || rows.length < POLL_BATCH_SIZE) {
      return
    }
  }
}
