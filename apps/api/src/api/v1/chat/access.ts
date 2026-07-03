import { getChatArtistByHandle, listPaidIntervals } from '@litomi/db/app/query/chat'
import type { PaidInterval } from '@litomi/domain/chat/policy'
import type { Context } from 'hono'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'

export type TimelineAccess =
  | { kind: 'entitled' }
  | {
      kind: 'lapsed'
      intervals: PaidInterval[]
    }
  | { kind: 'owner' }

// 열람권의 정본은 paid invoice 구간 — 현재 시각을 덮는 구간이 있으면 entitled,
// 과거 구간만 있으면 lapsed(그 창의 브로드캐스트만 열람), 없으면 접근 불가.
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

  const now = new Date()

  if (intervals.some((interval) => interval.startedAt <= now && now < interval.expiresAt)) {
    return { kind: 'entitled' }
  }

  return intervals.length > 0 ? { kind: 'lapsed', intervals } : undefined
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
