import { getChatCreatorByUserId, hasActiveChatSubscription } from '@litomi/db/app/query/chat'

// 채팅 스트림에 대한 실시간 구독(read) 권한을 처리합니다.
//
// 실시간 룸은 단 두 종류뿐이고, 접근 정책이 룸 id에 인코딩되어 있습니다:
//   b:{creatorId}   브로드캐스트 — 활성 구독자(결제 중) 또는 크리에이터 본인만
//   c:{creatorId}   크리에이터 인바운드 집계(모든 팬 답장 fan-in) — 크리에이터 본인만
//
// 답장 저장 스트림 rb:{creatorId}:{bubbleId}는 실시간 룸이 아닙니다 — 팬은 b:만, 크리에이터는
// c:만 구독합니다. 따라서 rb:(또는 그 외 무엇이든) 구독 시도는 전부 거부됩니다.

type ParsedStream = { kind: 'broadcast'; creatorId: number } | { kind: 'creatorInbound'; creatorId: number }

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

  // 인바운드 집계 채널은 오직 크리에이터 본인만 구독할 수 있습니다.
  if (parsed.kind === 'creatorInbound') {
    return ownsCreator(userId, parsed.creatorId)
  }

  // 브로드캐스트: 일반적인 경우는 결제한 팬이므로 구독 여부를 먼저 확인하고, 그다음 소유권(본인 스트림)을 확인합니다.
  return (await hasActiveChatSubscription(userId, parsed.creatorId)) || (await ownsCreator(userId, parsed.creatorId))
}

async function ownsCreator(userId: number, creatorId: number): Promise<boolean> {
  const owned = await getChatCreatorByUserId(userId)
  return owned?.id === creatorId
}

function parseStreamId(streamId: string): ParsedStream | null {
  const parts = streamId.split(':')
  if (parts.length !== 2) {
    return null
  }

  const creatorId = toId(parts[1])
  if (creatorId === null) {
    return null
  }

  if (parts[0] === 'b') {
    return { kind: 'broadcast', creatorId }
  }
  if (parts[0] === 'c') {
    return { kind: 'creatorInbound', creatorId }
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
