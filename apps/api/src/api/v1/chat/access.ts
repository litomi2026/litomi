import type { ChatReplyLimit } from '@litomi/contracts'
import { getChatArtistByHandle, listPaidIntervals, type PaidInterval } from '@litomi/db/app/query/chat'
import type { Context } from 'hono'
import ms from 'ms'

import type { Env } from '@/app'

import { problemResponse } from '@/utils/problem'

// 팬 답장 한도 — 기본 메시지당 3회/30자, 연속 구독 30일을 채울 때마다 +30자, 300자에서 상한.
// "연속"의 근거는 끊김 없이 이어진 유료 기간(listPaidIntervals의 병합 구간)이므로,
// 구독이 끊겼다 재개되면 보너스는 처음부터 다시 쌓입니다.
// 현재 시각을 덮는 유료 구간이 없으면(=답장 자격 없음) undefined를 반환합니다.
const REPLY_BASE_COUNT = 3
const REPLY_BASE_TEXT_LENGTH = 30
const REPLY_BONUS_MAX = 9
const REPLY_BONUS_UNIT_MS = ms('30 days')

export function resolveReplyLimit(intervals: PaidInterval[], now: Date): ChatReplyLimit | undefined {
  const current = intervals.find((interval) => interval.startedAt <= now && now < interval.expiresAt)

  if (!current) {
    return undefined
  }

  const bonus = Math.min(
    REPLY_BONUS_MAX,
    Math.floor((now.getTime() - current.startedAt.getTime()) / REPLY_BONUS_UNIT_MS),
  )

  return {
    maxRepliesPerMessage: REPLY_BASE_COUNT,
    maxTextLength: REPLY_BASE_TEXT_LENGTH * (1 + bonus),
  }
}

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
