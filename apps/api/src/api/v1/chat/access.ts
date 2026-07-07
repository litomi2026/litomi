import { getChatArtistByHandle, listPaidIntervals } from '@litomi/db/app/query/chat'
import type { PaidInterval } from '@litomi/domain/chat/policy'
import type { Context } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'

export type TimelineAccess =
  | { kind: 'owner' }
  | {
      kind: 'fan'
      intervals: PaidInterval[]
    }

// 열람권의 정본은 paid invoice 구간 — 팬은 결제한 기간(현재·과거 무관)에 발송된 브로드캐스트만
// 열람한다. 결제 이력이 없으면 접근 불가. "현재 구독 중"인지(답장 자격)는 별개 축이라 여기서
// 판정하지 않는다(resolveReplyTextLimit).
export async function resolveTimelineAccess(
  userId: number,
  // artist.userId null = 탈퇴한 아티스트의 tombstone — owner 판정만 항상 불일치로 흐른다.
  artist: { id: number; userId: number | null },
): Promise<TimelineAccess | undefined> {
  if (artist.userId === userId) {
    return { kind: 'owner' }
  }

  const intervals = await listPaidIntervals({
    userId,
    artistId: artist.id,
  })

  return intervals.length > 0 ? { kind: 'fan', intervals } : undefined
}

export async function requireOwnedArtist(c: Context<Env>) {
  const userId = c.get('userId')!
  const handle = c.req.param('handle')

  if (!handle) {
    return { error: problemResponse(c, { status: 404 }) }
  }

  const artist = await getChatArtistByHandle(handle)

  if (!artist) {
    return { error: problemResponse(c, { status: 404 }) }
  }

  if (artist.userId !== userId) {
    return { error: problemResponse(c, { status: 403 }) }
  }

  return { artist }
}
