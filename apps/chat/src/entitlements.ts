import { canAccessBroadcast, getChatArtistByUserId } from '@litomi/db/app/query/chat'

// 채팅 룸에 대한 실시간 구독(read) 권한을 처리합니다. 접근 정책은 룸 id에 인코딩됩니다:
//   b:{artistId}            브로드캐스트 — 활성 구독자(결제 중) 또는 아티스트 본인만
//   c:{artistId}            아티스트 인바운드 집계(모든 팬 답장 fan-in) — 아티스트 본인만
//   rr:{artistId}:{msgId}   포커스한 답장방 실시간 — 아티스트 본인만
//   fc:{artistId}:{fanId}   팬 인바운드(아티스트의 1:1 답장) — 그 팬 본인만(구독 무관: 1:1
//                           히스토리는 항상 열람이므로 결제 상태를 확인하지 않는다)
// 그 외 룸 id는 전부 거부됩니다.

type ParsedStream =
  | { kind: 'broadcast'; artistId: number }
  | { kind: 'artistInbound'; artistId: number }
  | { kind: 'replyRoom'; artistId: number }
  | { kind: 'fanInbound'; artistId: number; fanId: number }

// 'sub' 요청 폭주나 무작위 streamId 탐색이 데이터베이스에 과부하를 주지 않도록 권한 결정 결과는 짧은 시간 동안 캐시됩니다.
const AUTHZ_CACHE_TTL_MS = 30_000
const AUTHZ_CACHE_MAX_ENTRIES = 10_000

interface CacheEntry {
  allowed: boolean
  expiresAt: number
}

// `${userId}:${streamId}`를 키로 사용하는 제한된 크기의 LRU+TTL 캐시입니다.
// Map은 삽입 순서를 유지하므로, 값을 읽을 때마다 항목을 다시 삽입(re-insert)하면
// 가장 첫 번째 키가 가장 오래 전에 사용된(least-recently-used) 항목이 됩니다.
const cache = new Map<string, CacheEntry>()

// 강퇴 이벤트(환불) 직후 캐시된 allow가 재구독을 통과시키지 않도록 항목을 지웁니다.
export function invalidateAccessCache(userId: number, streamId: string): void {
  cache.delete(`${userId}:${streamId}`)
}

export async function canAccessStream(userId: number, streamId: string): Promise<boolean> {
  const key = `${userId}:${streamId}`

  const cached = cacheGet(key)
  if (cached !== undefined) {
    return cached
  }

  const allowed = await resolveAccess(userId, streamId)
  cacheSet(key, allowed)
  return allowed
}

async function resolveAccess(userId: number, streamId: string): Promise<boolean> {
  const parsed = parseStreamId(streamId)

  if (!parsed) {
    return false
  }

  switch (parsed.kind) {
    // 인바운드 집계·포커스 답장방은 오직 아티스트 본인만 구독할 수 있습니다.
    case 'artistInbound':
    case 'replyRoom':
      return ownsArtist(userId, parsed.artistId)
    // 팬 인바운드는 그 팬 본인만 — 결제 상태와 무관(히스토리 열람은 항상 허용).
    case 'fanInbound':
      return userId === parsed.fanId
    // 브로드캐스트: 결제한 팬 또는 아티스트 본인 — 한 왕복으로 판정합니다.
    case 'broadcast':
      return canAccessBroadcast({ userId, artistId: parsed.artistId })
  }
}

async function ownsArtist(userId: number, artistId: number): Promise<boolean> {
  const owned = await getChatArtistByUserId(userId)
  return owned?.id === artistId
}

function parseStreamId(streamId: string): ParsedStream | null {
  const parts = streamId.split(':')
  const artistId = toId(parts[1])

  if (artistId === null) {
    return null
  }

  if (parts.length === 2) {
    if (parts[0] === 'b') {
      return { kind: 'broadcast', artistId }
    }
    if (parts[0] === 'c') {
      return { kind: 'artistInbound', artistId }
    }
    return null
  }

  // 3-part rooms. messageId(ULID)는 콜론을 포함하지 않으므로 split이 정확히 3조각이 된다.
  if (parts.length === 3) {
    if (parts[0] === 'fc') {
      const fanId = toId(parts[2])
      return fanId === null ? null : { kind: 'fanInbound', artistId, fanId }
    }
    if (parts[0] === 'rr') {
      return parts[2] ? { kind: 'replyRoom', artistId } : null
    }
  }

  return null
}

function toId(value: string | undefined): number | null {
  if (!value) {
    return null
  }

  const id = Number(value)
  return Number.isSafeInteger(id) && id > 0 ? id : null
}

function cacheGet(key: string): boolean | undefined {
  const entry = cache.get(key)
  if (!entry) {
    return undefined
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key)
    return undefined
  }

  // 가장 최근에 사용됨(most-recently-used)으로 표시하기 위해 다시 삽입합니다.
  cache.delete(key)
  cache.set(key, entry)
  return entry.allowed
}

function cacheSet(key: string, allowed: boolean): void {
  cache.delete(key)
  cache.set(key, { allowed, expiresAt: Date.now() + AUTHZ_CACHE_TTL_MS })

  if (cache.size > AUTHZ_CACHE_MAX_ENTRIES) {
    const oldest = cache.keys().next().value
    if (oldest !== undefined) {
      cache.delete(oldest)
    }
  }
}
