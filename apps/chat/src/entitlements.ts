import { getChatCreatorByUserId, hasActiveChatSubscription } from '@litomi/db/query/chat'

// 채팅 스트림에 대한 실시간 읽기 권한(read-authorization)을 처리합니다.
//
// streamId 자체에 접근 정책이 인코딩되어 있습니다 (packages/db/src/chat/schema.ts 참고):
//   b:{creatorId}          브로드캐스트(broadcast) — 활성화된 구독자이거나 해당 크리에이터 본인만
//   r:{creatorId}:{fanId}  1:1 답장(reply) — 해당 팬(fan)이거나 해당 크리에이터 본인만

type ParsedStream =
  | {
      kind: 'broadcast'
      creatorId: number
    }
  | {
      kind: 'reply'
      creatorId: number
      fanId: number
    }

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
// 이를 통해 외부 라이브러리(dependency) 없이도 아주 저렴하게 LRU 방출(eviction)을 구현할 수 있습니다.
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

  if (parsed.kind === 'reply') {
    // 팬(fan) 측은 별도의 DB 조회가 필요 없습니다; 크리에이터 본인 여부만 확인하면 됩니다.
    return parsed.fanId === userId || (await ownsCreator(userId, parsed.creatorId))
  }

  // 브로드캐스트: 일반적인 경우는 결제한 팬(fan)이므로 구독 여부를 먼저 확인하고, 소유권(크리에이터가 자신의 스트림을 보는 경우)을 확인합니다.
  return (await hasActiveChatSubscription(userId, parsed.creatorId)) || (await ownsCreator(userId, parsed.creatorId))
}

async function ownsCreator(userId: number, creatorId: number): Promise<boolean> {
  const owned = await getChatCreatorByUserId(userId)
  return owned?.id === creatorId
}

function parseStreamId(streamId: string): ParsedStream | null {
  const parts = streamId.split(':')

  if (parts[0] === 'b' && parts.length === 2) {
    const creatorId = toId(parts[1])
    return creatorId === null ? null : { kind: 'broadcast', creatorId }
  }

  if (parts[0] === 'r' && parts.length === 3) {
    const creatorId = toId(parts[1])
    const fanId = toId(parts[2])
    return creatorId === null || fanId === null ? null : { kind: 'reply', creatorId, fanId }
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
