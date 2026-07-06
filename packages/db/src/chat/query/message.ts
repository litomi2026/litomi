import { and, asc, count, desc, eq, gt, gte, inArray, lt, max, or } from 'drizzle-orm'
import { encodeTime, ulid } from 'ulid'

import { chatDB } from '../db'
import { chatBroadcastTable, chatDmMessageTable } from '../schema'
import { clampPageSize } from './common'

export type ChatBroadcastRow = typeof chatBroadcastTable.$inferSelect
export type ChatDmMessageRow = typeof chatDmMessageTable.$inferSelect
export type ChatSenderRole = 'artist' | 'fan'

const ULID_TIME_LENGTH = 10
const ULID_RANDOM_MIN = '0'.repeat(16)

// The smallest ULID whose time component is `date` — used to turn a time window into a
// messageId range (e.g. a lapsed fan's paid-interval bounds).
export function messageIdAtOrAfter(date: Date): string {
  return encodeTime(date.getTime(), ULID_TIME_LENGTH) + ULID_RANDOM_MIN
}

// --- Broadcast feed -----------------------------------------------------------

export interface AppendBroadcastInput {
  artistId: number
  contentType: string
  content: unknown
}

// The api mints the id/timestamp (so it can return the id and publish to Kafka); the
// chat-worker persists the built row. Split so both sides agree on the same messageId.
export function buildBroadcast(input: AppendBroadcastInput): ChatBroadcastRow {
  return { ...input, messageId: ulid(), createdAt: new Date() }
}

export async function putBroadcast(row: ChatBroadcastRow): Promise<void> {
  await chatDB
    .insert(chatBroadcastTable)
    .values(row)
    .onConflictDoNothing({ target: [chatBroadcastTable.artistId, chatBroadcastTable.messageId] })
}

// --- 1:1 direct messages ------------------------------------------------------

export interface AppendDmMessageInput {
  artistId: number
  fanId: number
  contextMessageId: string
  senderRole: ChatSenderRole
  quotedMessageId: string | null
  contentType: string
  content: unknown
}

export function buildDmMessage(input: AppendDmMessageInput): ChatDmMessageRow {
  return { ...input, messageId: ulid(), createdAt: new Date() }
}

export async function putDmMessage(row: ChatDmMessageRow): Promise<void> {
  await chatDB
    .insert(chatDmMessageTable)
    .values(row)
    .onConflictDoNothing({
      target: [chatDmMessageTable.artistId, chatDmMessageTable.fanId, chatDmMessageTable.messageId],
    })
}

export interface FanReplyGate {
  // 아티스트의 마지막 메시지(전체 방송 ∪ 이 팬에게 온 1:1 답장 중 더 최신) 이후 이 팬이 보낸 답장 수.
  repliesSinceLastArtistMessage: number
}

export interface FanReplyGateKey {
  artistId: number
  contextMessageId: string
  fanId: number
}

// Reply gate — 쿼터의 기준점은 "아티스트의 마지막 메시지"(아티스트가 새 메시지를 보내면 쿼터가
// 다시 채워진다). 1차 왕복: 대상 말풍선 존재(anchor) + 마지막 방송 id + 이 팬에게 온 마지막 1:1
// 답장 id를 병렬 조회, 2차: 그 기준점 이후 팬 답장 수를 PK 꼬리 스캔으로 센다(쿼터가 3이라 꼬리는
// 항상 몇 행 이내). 대상 말풍선이 없으면 undefined.
export async function getFanReplyGate({
  artistId,
  contextMessageId,
  fanId,
}: FanReplyGateKey): Promise<FanReplyGate | undefined> {
  const [anchorRows, lastBroadcastRows, lastAnswerRows] = await Promise.all([
    chatDB
      .select({ messageId: chatBroadcastTable.messageId })
      .from(chatBroadcastTable)
      .where(and(eq(chatBroadcastTable.artistId, artistId), eq(chatBroadcastTable.messageId, contextMessageId)))
      .limit(1),
    chatDB
      .select({ messageId: max(chatBroadcastTable.messageId) })
      .from(chatBroadcastTable)
      .where(eq(chatBroadcastTable.artistId, artistId)),
    chatDB
      .select({ messageId: max(chatDmMessageTable.messageId) })
      .from(chatDmMessageTable)
      .where(
        and(
          eq(chatDmMessageTable.artistId, artistId),
          eq(chatDmMessageTable.fanId, fanId),
          eq(chatDmMessageTable.senderRole, 'artist'),
        ),
      ),
  ])

  if (anchorRows.length === 0) {
    return undefined
  }

  // anchor가 존재하므로 방송 max는 항상 있다 — ULID는 사전순 = 시간순이라 문자열 비교로 충분.
  const lastBroadcastId = lastBroadcastRows[0]?.messageId ?? ''
  const lastAnswerId = lastAnswerRows[0]?.messageId ?? ''
  const lastArtistMessageId = lastBroadcastId > lastAnswerId ? lastBroadcastId : lastAnswerId

  const [row] = await chatDB
    .select({ replies: count() })
    .from(chatDmMessageTable)
    .where(
      and(
        eq(chatDmMessageTable.artistId, artistId),
        eq(chatDmMessageTable.fanId, fanId),
        eq(chatDmMessageTable.senderRole, 'fan'),
        gt(chatDmMessageTable.messageId, lastArtistMessageId),
      ),
    )

  return { repliesSinceLastArtistMessage: Number(row?.replies ?? 0) }
}

// --- Reads --------------------------------------------------------------------

// messageId(ULID) 반열린 구간 [fromId, toIdExclusive). 시간 창을 messageId 범위로 변환할 때 사용.
export interface TimelineWindow {
  fromId: string
  toIdExclusive: string
}

export interface ListBroadcastOptions {
  // windows가 주어지면 그 messageId 범위에 드는 말풍선만(예: 만료 팬은 결제 기간 방송만).
  // 빈 배열이면 결과 없음. 미지정이면 전체.
  windows?: TimelineWindow[]
  before?: string
  after?: string
  limit?: number
}

// 아티스트 브로드캐스트 피드를 시간순으로 읽는다(팬 타임라인의 방송 축).
export async function listBroadcast(artistId: number, options: ListBroadcastOptions = {}): Promise<ChatBroadcastRow[]> {
  const conditions = [eq(chatBroadcastTable.artistId, artistId)]

  if (options.windows) {
    if (options.windows.length === 0) {
      return []
    }

    const windowConditions = options.windows.map((window) =>
      and(gte(chatBroadcastTable.messageId, window.fromId), lt(chatBroadcastTable.messageId, window.toIdExclusive)),
    )

    conditions.push(or(...windowConditions)!)
  }

  if (options.before) {
    conditions.push(lt(chatBroadcastTable.messageId, options.before))
  }

  if (options.after) {
    conditions.push(gt(chatBroadcastTable.messageId, options.after))
  }

  const isForwardSync = Boolean(options.after) && !options.before
  const order = isForwardSync ? asc(chatBroadcastTable.messageId) : desc(chatBroadcastTable.messageId)

  const rows = await chatDB
    .select()
    .from(chatBroadcastTable)
    .where(and(...conditions))
    .orderBy(order)
    .limit(clampPageSize(options.limit))

  if (isForwardSync) {
    rows.reverse()
  }

  return rows
}

export interface ListFanTimelineInput {
  artistId: number
  fanId: number
  before?: string
  after?: string
  limit?: number
}

// 한 팬의 아티스트와의 1:1 메시지(팬 답장 + 아티스트 답장, 양방향)를 시간순으로 읽는다
// (팬 타임라인의 1:1 축). PK (artistId, fanId, messageId) 정확 범위 스캔. 열람권과 무관하게
// 항상 조회 가능(히스토리는 팬 개인 자산).
export async function listFanTimeline(input: ListFanTimelineInput): Promise<ChatDmMessageRow[]> {
  const conditions = [eq(chatDmMessageTable.artistId, input.artistId), eq(chatDmMessageTable.fanId, input.fanId)]

  if (input.before) {
    conditions.push(lt(chatDmMessageTable.messageId, input.before))
  }

  if (input.after) {
    conditions.push(gt(chatDmMessageTable.messageId, input.after))
  }

  const isForwardSync = Boolean(input.after) && !input.before
  const order = isForwardSync ? asc(chatDmMessageTable.messageId) : desc(chatDmMessageTable.messageId)

  const rows = await chatDB
    .select()
    .from(chatDmMessageTable)
    .where(and(...conditions))
    .orderBy(order)
    .limit(clampPageSize(input.limit))

  if (isForwardSync) {
    rows.reverse()
  }

  return rows
}

export interface ListReplyRoomOptions {
  before?: string
  limit?: number
}

// 말풍선 M의 답장방 타임라인: 그 방의 모든 1:1 메시지(모든 팬의 답장 ∪ 아티스트의 답장)를
// 하나의 시간순 스트림으로 최신순 읽는다(아티스트만). reply-room 인덱스
// (artistId, contextMessageId, messageId) 역스캔. keyset은 messageId.
export async function listReplyRoomTimeline(
  artistId: number,
  contextMessageId: string,
  options: ListReplyRoomOptions = {},
): Promise<ChatDmMessageRow[]> {
  const conditions = [
    eq(chatDmMessageTable.artistId, artistId),
    eq(chatDmMessageTable.contextMessageId, contextMessageId),
  ]

  if (options.before) {
    conditions.push(lt(chatDmMessageTable.messageId, options.before))
  }

  return chatDB
    .select()
    .from(chatDmMessageTable)
    .where(and(...conditions))
    .orderBy(desc(chatDmMessageTable.messageId))
    .limit(clampPageSize(options.limit))
}

// 같은 답장방 파티션에서 인용 대상 원문 일괄 조회 — 인용 프리뷰용. 인용 관계는 항상 같은
// (artistId, contextMessageId) 안에 있다(아티스트 답장 ↔ 그 팬의 답장).
export async function getReplyRoomMessagesByIds(
  artistId: number,
  contextMessageId: string,
  messageIds: string[],
): Promise<Map<string, ChatDmMessageRow>> {
  if (messageIds.length === 0) {
    return new Map()
  }

  const rows = await chatDB
    .select()
    .from(chatDmMessageTable)
    .where(
      and(
        eq(chatDmMessageTable.artistId, artistId),
        eq(chatDmMessageTable.contextMessageId, contextMessageId),
        inArray(chatDmMessageTable.messageId, messageIds),
      ),
    )

  return new Map(rows.map((row) => [row.messageId, row]))
}

// 팬의 아티스트별 "가장 최근 아티스트 1:1 답장" 한 건씩 — 팬 채팅 리스트에서 최신 활동/프리뷰를
// 방송 요약과 비교(max)하기 위함. DISTINCT ON으로 아티스트당 최신 한 행만.
export async function getLatestArtistDmPerArtist(
  fanId: number,
  artistIds: number[],
): Promise<Map<number, ChatDmMessageRow>> {
  if (artistIds.length === 0) {
    return new Map()
  }

  const rows = await chatDB
    .selectDistinctOn([chatDmMessageTable.artistId])
    .from(chatDmMessageTable)
    .where(
      and(
        inArray(chatDmMessageTable.artistId, artistIds),
        eq(chatDmMessageTable.fanId, fanId),
        eq(chatDmMessageTable.senderRole, 'artist'),
      ),
    )
    .orderBy(asc(chatDmMessageTable.artistId), desc(chatDmMessageTable.messageId))

  return new Map(rows.map((row) => [row.artistId, row]))
}

// (artistId, fanId) 대화에서 주어진 messageId들의 행을 일괄 조회 — 팬 타임라인의 인용
// 프리뷰(quotedMessageId → 원문)를 해석하기 위함. PK 정확 조회.
export async function getDmMessagesByIds(
  artistId: number,
  fanId: number,
  messageIds: string[],
): Promise<Map<string, ChatDmMessageRow>> {
  if (messageIds.length === 0) {
    return new Map()
  }

  const rows = await chatDB
    .select()
    .from(chatDmMessageTable)
    .where(
      and(
        eq(chatDmMessageTable.artistId, artistId),
        eq(chatDmMessageTable.fanId, fanId),
        inArray(chatDmMessageTable.messageId, messageIds),
      ),
    )

  return new Map(rows.map((row) => [row.messageId, row]))
}

export interface HasFanRepliesInput {
  fanId: number
  artistId: number
  window: TimelineWindow
}

// 한 팬이 한 아티스트에게 주어진 messageId 시간 창 안에 보낸 답장이 있는지 —
// 청약철회 조건("해당 결제 기간 답장 미발신") 판정용.
export async function hasFanRepliesInWindow({ fanId, artistId, window }: HasFanRepliesInput): Promise<boolean> {
  const [row] = await chatDB
    .select({ messageId: chatDmMessageTable.messageId })
    .from(chatDmMessageTable)
    .where(
      and(
        eq(chatDmMessageTable.artistId, artistId),
        eq(chatDmMessageTable.fanId, fanId),
        eq(chatDmMessageTable.senderRole, 'fan'),
        gte(chatDmMessageTable.messageId, window.fromId),
        lt(chatDmMessageTable.messageId, window.toIdExclusive),
      ),
    )
    .limit(1)

  return row !== undefined
}
