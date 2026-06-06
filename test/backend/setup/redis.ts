import { mock } from 'bun:test'

type PipelineCommand = () => Promise<unknown>

const strings = new Map<string, string>()
const sortedSets = new Map<string, Map<string, number>>()
const expirations = new Map<string, number>()

export const redis = {
  status: 'ready',

  connect: async () => undefined,

  del: async (...keys: string[]) => {
    let deleted = 0

    for (const key of keys) {
      if (deleteKey(key)) {
        deleted += 1
      }
    }

    return deleted
  },

  disconnect: () => undefined,

  eval: async (script: string, keyCount: number, ...args: unknown[]) => {
    if (keyCount !== 1) {
      throw new Error(`Unsupported Redis eval key count in backend tests: ${keyCount}`)
    }

    const key = String(args[0])
    const redisArgs = args.slice(keyCount)

    if (script.includes('redis.call("INCR", KEYS[1])')) {
      return checkRateLimit(key, Number(redisArgs[0]))
    }

    if (script.includes('redis.call("SET", KEYS[1], next')) {
      return rewardRateLimit(key, Number(redisArgs[0]))
    }

    throw new Error('Unsupported Redis eval script in backend tests')
  },

  exists: async (...keys: string[]) => {
    return keys.filter((key) => keyExists(key)).length
  },

  expire: async (key: string, seconds: number) => {
    return expireKey(key, seconds)
  },

  flushdb: async () => {
    flushAll()
    return 'OK'
  },

  get: async (key: string) => {
    purgeExpiredKey(key)
    return strings.get(key) ?? null
  },

  getdel: async (key: string) => {
    purgeExpiredKey(key)
    const value = strings.get(key) ?? null
    deleteKey(key)
    return value
  },

  off: () => redis,

  on: () => redis,

  once: () => redis,

  ping: async () => 'PONG',

  pipeline: () => {
    const commands: PipelineCommand[] = []
    const pipeline = {
      del: (key: string) => {
        commands.push(() => redis.del(key))
        return pipeline
      },

      exec: async () => {
        const results: Array<[Error | null, unknown]> = []

        for (const command of commands) {
          try {
            results.push([null, await command()])
          } catch (error) {
            results.push([error instanceof Error ? error : new Error(String(error)), null])
          }
        }

        return results
      },

      expire: (key: string, seconds: number) => {
        commands.push(() => redis.expire(key, seconds))
        return pipeline
      },

      zincrby: (key: string, increment: number, member: string) => {
        commands.push(() => redis.zincrby(key, increment, member))
        return pipeline
      },
    }

    return pipeline
  },

  quit: async () => 'OK',

  set: async (key: string, value: unknown, mode?: string, seconds?: number) => {
    setString(key, String(value))

    if (mode?.toUpperCase() === 'EX' && seconds !== undefined) {
      expireKey(key, seconds)
    }

    return 'OK'
  },

  zrange: async (key: string, start: number, stop: number, ...options: string[]) => {
    purgeExpiredKey(key)

    const set = sortedSets.get(key)
    if (!set) {
      return []
    }

    const reverse = options.some((option) => option.toUpperCase() === 'REV')
    const withScores = options.some((option) => option.toUpperCase() === 'WITHSCORES')
    const entries = [...set.entries()].sort(([leftMember, leftScore], [rightMember, rightScore]) => {
      const scoreOrder = reverse ? rightScore - leftScore : leftScore - rightScore
      return scoreOrder || leftMember.localeCompare(rightMember)
    })
    const from = normalizeRangeIndex(start, entries.length)
    const to = normalizeRangeIndex(stop, entries.length)
    const selected = entries.slice(from, to + 1)

    if (!withScores) {
      return selected.map(([member]) => member)
    }

    return selected.flatMap(([member, score]) => [member, String(score)])
  },

  zincrby: async (key: string, increment: number, member: string) => {
    purgeExpiredKey(key)
    strings.delete(key)

    const set = sortedSets.get(key) ?? new Map<string, number>()
    const next = (set.get(member) ?? 0) + Number(increment)
    set.set(member, next)
    sortedSets.set(key, set)
    return String(next)
  },

  zunionstore: async (destination: string, keyCount: number, ...args: unknown[]) => {
    const sourceKeys = args.slice(0, keyCount).map(String)
    const weights = readZunionWeights(keyCount, args.slice(keyCount))
    const aggregate = new Map<string, number>()

    for (const [index, sourceKey] of sourceKeys.entries()) {
      purgeExpiredKey(sourceKey)

      for (const [member, score] of sortedSets.get(sourceKey)?.entries() ?? []) {
        aggregate.set(member, (aggregate.get(member) ?? 0) + score * weights[index])
      }
    }

    strings.delete(destination)
    sortedSets.set(destination, aggregate)
    expirations.delete(destination)
    return aggregate.size
  },
}

mock.module('@litomi/db/redis', () => ({
  closeRedis,
  connectRedis,
  getdelRedisJson,
  getRedisJson,
  pingRedis,
  redis,
  setRedisJson,
}))

export async function closeRedis() {}

export async function connectRedis() {}

export async function getdelRedisJson<T>(key: string): Promise<T | null> {
  return parseJson<T>(await redis.getdel(key))
}

export async function getRedisJson<T>(key: string): Promise<T | null> {
  return parseJson<T>(await redis.get(key))
}

export async function pingRedis() {
  await redis.ping()
}

export async function setRedisJson(key: string, value: unknown, options?: { ex?: number }) {
  await redis.set(key, JSON.stringify(value), options?.ex ? 'EX' : undefined, options?.ex)
}

function checkRateLimit(key: string, windowSeconds: number): [number, number] {
  const current = incrementString(key)

  if (current === 1) {
    expireKey(key, windowSeconds)
  }

  let ttl = getTTL(key)

  if (ttl < 0) {
    expireKey(key, windowSeconds)
    ttl = windowSeconds
  }

  return [current, ttl]
}

function deleteKey(key: string): boolean {
  purgeExpiredKey(key)

  const deleted = strings.delete(key) || sortedSets.delete(key)
  expirations.delete(key)
  return deleted
}

function expireKey(key: string, seconds: number): 0 | 1 {
  if (!keyExists(key)) {
    return 0
  }

  expirations.set(key, Date.now() + seconds * 1000)
  return 1
}

function flushAll() {
  strings.clear()
  sortedSets.clear()
  expirations.clear()
}

function getTTL(key: string): number {
  purgeExpiredKey(key)

  if (!keyExists(key)) {
    return -2
  }

  const expiresAt = expirations.get(key)
  if (!expiresAt) {
    return -1
  }

  return Math.max(Math.ceil((expiresAt - Date.now()) / 1000), 0)
}

function incrementString(key: string): number {
  purgeExpiredKey(key)
  sortedSets.delete(key)

  const current = Number(strings.get(key) ?? '0') + 1
  strings.set(key, String(current))
  return current
}

function keyExists(key: string): boolean {
  purgeExpiredKey(key)
  return strings.has(key) || sortedSets.has(key)
}

function normalizeRangeIndex(index: number, length: number): number {
  if (index < 0) {
    return Math.max(length + index, 0)
  }

  return Math.min(index, length)
}

function parseJson<T>(value: string | null): T | null {
  return value === null ? null : (JSON.parse(value) as T)
}

function purgeExpiredKey(key: string) {
  const expiresAt = expirations.get(key)

  if (expiresAt === undefined || expiresAt > Date.now()) {
    return
  }

  strings.delete(key)
  sortedSets.delete(key)
  expirations.delete(key)
}

function readZunionWeights(keyCount: number, args: unknown[]): number[] {
  const weights = Array.from({ length: keyCount }, () => 1)
  const weightsIndex = args.findIndex((arg) => String(arg).toUpperCase() === 'WEIGHTS')

  if (weightsIndex === -1) {
    return weights
  }

  for (let index = 0; index < keyCount; index += 1) {
    weights[index] = Number(args[weightsIndex + 1 + index] ?? 1)
  }

  return weights
}

function rewardRateLimit(key: string, decrement: number): [number, number] {
  const ttl = getTTL(key)

  if (ttl <= 0) {
    return [0, ttl]
  }

  const next = Math.max(Number(strings.get(key) ?? '0') - decrement, 0)
  strings.set(key, String(next))
  expireKey(key, ttl)
  return [next, ttl]
}

function setString(key: string, value: string) {
  sortedSets.delete(key)
  strings.set(key, value)
  expirations.delete(key)
}
