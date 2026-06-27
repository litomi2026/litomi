import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import ms from 'ms'
import pLimit from 'p-limit'
import { z } from 'zod'

type CacheDecision = 'exists' | 'missing' | 'unknown'

type CacheEntry = {
  checkedAt: string
  decision: CacheDecision
  status: number | null
  finalUrl: string | null
  error?: string
}

type CacheMap = Record<string, CacheEntry>

type SponsorLink = {
  label: string
  value: string
}

type SponsorsMap = Record<string, SponsorLink[]>

const SponsorsMapSchema: z.ZodType<SponsorsMap> = z.record(
  z.string(),
  z.array(z.object({ label: z.string(), value: z.string() })),
)

const ArtistKeyMapSchema: z.ZodType<Record<string, unknown>> = z.record(z.string(), z.unknown())

const CacheEntrySchema: z.ZodType<CacheEntry> = z.object({
  checkedAt: z.string(),
  decision: z.enum(['exists', 'missing', 'unknown']),
  status: z.number().int().nullable(),
  finalUrl: z.string().nullable(),
  error: z.string().optional(),
})

const CacheSchema: z.ZodType<CacheMap> = z.record(z.string(), CacheEntrySchema)

const ArgsSchema = z
  .object({
    sponsors: z.string().default('src/sponsor/artist.json'),
    artists: z.string().default('src/translation/artist.json'),
    output: z.string().optional(),
    write: z.boolean().default(false),
    dryRun: z.boolean().default(false),
    limit: z.number().int().positive().optional(),
    concurrency: z.number().int().positive().max(20).default(4),
    timeout: z.string().default('10s'),
    maxAge: z.string().default('30d'),
    retries: z.number().int().min(0).max(5).default(1),
    cache: z.string().optional(),
    refresh: z.boolean().default(false),
    progressInterval: z.string().default('2s'),
    checkpointInterval: z.string().default('1m'),
    checkpointEvery: z.number().int().positive().max(10_000).default(500),
    checkpointOutput: z.boolean().default(false),
  })
  .superRefine((value, ctx) => {
    if (value.output && value.write) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '--write와 --output은 동시에 사용할 수 없어요 (--write는 입력 파일을 덮어써요)',
      })
    }
  })

type Args = z.infer<typeof ArgsSchema>

type Candidate = {
  artistKey: string
  usernames: string[]
}

const XUsernameRegex = /^[A-Za-z0-9_]{1,15}$/

function addXLink(params: { sponsors: SponsorsMap; artistKey: string; url: string }) {
  const { sponsors, artistKey, url } = params

  const normalized = normalizeUrl(url)
  if (!normalized) return false

  const links = sponsors[artistKey] ?? []
  if (links.some((l) => l.label.trim().toLowerCase() === 'x' || normalizeUrl(l.value) === normalized)) {
    return false
  }

  sponsors[artistKey] = [...links, { label: 'X', value: normalized }]
  return true
}

function buildCandidateXUsernames(artistKey: string) {
  const raw = artistKey.trim()
  if (!raw) return []

  const candidates = new Set<string>()

  const direct = normalizeXUsername(raw)
  if (direct) candidates.add(direct)

  if (raw.includes('-')) {
    const withUnderscore = normalizeXUsername(raw.replaceAll('-', '_'))
    if (withUnderscore) candidates.add(withUnderscore)
  }

  return [...candidates]
}

async function checkXOnce(username: string, timeoutMs: number) {
  const headers: Record<string, string> = {
    Accept: '*/*',
    'User-Agent': 'litomi-x-sponsor-filler/1.0',
  }

  // 1) Prefer the public followbutton info endpoint (more reliable than HTML status).
  const followUrl = `https://cdn.syndication.twimg.com/widgets/followbutton/info.json?screen_names=${encodeURIComponent(username)}`
  try {
    const res = await fetchWithTimeout(followUrl, { method: 'GET', redirect: 'follow', headers }, timeoutMs)
    const status = res.status
    const contentType = (res.headers.get('content-type') ?? '').toLowerCase()
    const text = await res.text()

    if (status === 200 && contentType.includes('application/json')) {
      const json = safeJsonParse(text)
      if (Array.isArray(json)) {
        if (json.length === 0) {
          return { status, decision: 'missing' as const, finalUrl: null }
        }
        return { status, decision: 'exists' as const, finalUrl: `https://x.com/${username}` }
      }
    }

    // If this endpoint doesn't give a clear answer, fall through to HTML.
  } catch {
    // fall through
  }

  const profileUrl = `https://x.com/${encodeURIComponent(username)}`
  const res = await fetchWithTimeout(profileUrl, { method: 'GET', redirect: 'follow', headers }, timeoutMs)
  const status = res.status
  const body = await res.text()

  const decision = decideXFromHtml({ username, status, body })
  return { status, decision, finalUrl: decision === 'exists' ? `https://x.com/${username}` : null }
}

async function checkXWithRetry(params: { username: string; timeoutMs: number; retries: number }): Promise<CacheEntry> {
  const { username, timeoutMs, retries } = params

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { status, decision, finalUrl } = await checkXOnce(username, timeoutMs)

      if (decision !== 'unknown' || attempt === retries || !isRetryableStatus(status)) {
        return {
          checkedAt: new Date().toISOString(),
          decision,
          status,
          finalUrl: finalUrl ? normalizeUrl(finalUrl) : null,
          ...(decision === 'unknown' ? { error: `HTTP ${status}` } : {}),
        }
      }

      await sleep(getRetryDelayMs(attempt))
    } catch (error) {
      if (attempt === retries) {
        return {
          checkedAt: new Date().toISOString(),
          decision: 'unknown',
          status: null,
          finalUrl: null,
          error: formatErrorForLog(error),
        }
      }
      await sleep(getRetryDelayMs(attempt))
    }
  }

  return {
    checkedAt: new Date().toISOString(),
    decision: 'unknown',
    status: null,
    finalUrl: null,
    error: '알 수 없는 오류로 X 프로필 확인에 실패했어요',
  }
}

function decideXFromHtml(params: { username: string; status: number; body: string }): CacheDecision {
  const { username, status, body } = params

  if (status === 404) return 'missing'

  const missingMarkers = [
    '계정이 존재하지 않음',
    '계정이 존재하지 않습니다',
    "this account doesn't exist",
    'this account doesn’t exist',
    "account doesn't exist",
    'account doesn’t exist',
    'try searching for another',
  ]

  for (const marker of missingMarkers) {
    if (body.toLowerCase().includes(marker.toLowerCase())) {
      return 'missing'
    }
  }

  const errorMarkers = [
    'something went wrong, but don’t fret',
    "something went wrong, but don't fret",
    'something went wrong',
    'try again',
  ]

  for (const marker of errorMarkers) {
    if (body.toLowerCase().includes(marker.toLowerCase())) {
      return 'unknown'
    }
  }

  const usernameLower = username.toLowerCase()
  const lower = body.toLowerCase()
  const hasAt = new RegExp(`@${escapeRegex(usernameLower)}\\b`, 'i').test(body)
  const hasUrl =
    lower.includes(`https://x.com/${usernameLower}`) || lower.includes(`https://twitter.com/${usernameLower}`)

  if (hasAt || hasUrl) return 'exists'

  // Status 200 can still mean "doesn't exist" (as you observed), so be conservative.
  if (status >= 200 && status < 400) return 'unknown'

  if (status === 401 || status === 403) return 'unknown'

  return 'unknown'
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(id)
  }
}

function formatErrorForLog(error: unknown) {
  if (error instanceof Error) return error.message
  if (error && typeof error === 'object') {
    const maybeCode = (error as { code?: unknown }).code
    if (typeof maybeCode === 'string') return maybeCode
  }
  return String(error)
}

function getDefaultCachePath() {
  return join(process.cwd(), '.cache', 'sponsors', 'x-exists.json')
}

function getRetryDelayMs(attempt: number) {
  return Math.min(ms('30s'), ms('500ms') * 2 ** attempt + Math.random() * ms('250ms'))
}

function hasXLink(links: SponsorLink[]) {
  for (const link of links) {
    if (link.label.trim().toLowerCase() === 'x') return true
    if (isXProfileUrl(link.value)) return true
  }
  return false
}

function isFresh(entry: CacheEntry, maxAgeMs: number) {
  const decidedAt = Date.parse(entry.checkedAt)
  if (!Number.isFinite(decidedAt)) return false
  return decidedAt + maxAgeMs > Date.now()
}

function isRetryableStatus(status: number) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504
}

function isXProfileUrl(url: string) {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host !== 'x.com' && host !== 'twitter.com') return false
    if (u.pathname.startsWith('/intent/user')) return true
    const path = u.pathname.replace(/^\/+/, '')
    return Boolean(path) && !path.includes('/')
  } catch {
    return false
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2))

  const timeoutMs = ms(args.timeout as ms.StringValue)
  if (typeof timeoutMs !== 'number' || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    console.error(`❌ timeout 값이 올바르지 않아요: ${args.timeout}`)
    process.exit(1)
  }

  const maxAgeMs = ms(args.maxAge as ms.StringValue)
  if (typeof maxAgeMs !== 'number' || !Number.isFinite(maxAgeMs) || maxAgeMs <= 0) {
    console.error(`❌ max-age 값이 올바르지 않아요: ${args.maxAge}`)
    process.exit(1)
  }

  const progressIntervalMs = ms(args.progressInterval as ms.StringValue)
  if (typeof progressIntervalMs !== 'number' || !Number.isFinite(progressIntervalMs) || progressIntervalMs <= 0) {
    console.error(`❌ progress-interval 값이 올바르지 않아요: ${args.progressInterval}`)
    process.exit(1)
  }

  const checkpointIntervalMs = ms(args.checkpointInterval as ms.StringValue)
  if (typeof checkpointIntervalMs !== 'number' || !Number.isFinite(checkpointIntervalMs) || checkpointIntervalMs <= 0) {
    console.error(`❌ checkpoint-interval 값이 올바르지 않아요: ${args.checkpointInterval}`)
    process.exit(1)
  }

  const sponsorsPath = resolve(process.cwd(), args.sponsors)
  const artistsPath = resolve(process.cwd(), args.artists)
  const outputPath = args.write ? sponsorsPath : args.output ? resolve(process.cwd(), args.output) : sponsorsPath

  const cachePath = args.cache ? resolve(process.cwd(), args.cache) : getDefaultCachePath()

  const shouldWrite = Boolean(args.write || args.output) && !args.dryRun
  const dryRun = args.dryRun || !shouldWrite

  if (!args.write && !args.output) {
    console.log('⚠️  --write/--output이 없어서 실제 파일은 덮어쓰지 않아요. (cache는 업데이트돼요)')
  }

  console.log('—')
  console.log(`📚 artists: ${artistsPath}`)
  console.log(`🧾 sponsors: ${sponsorsPath}`)
  console.log(`⚙️  동시성: ${args.concurrency}`)
  console.log(`⏱️  timeout: ${args.timeout}`)
  console.log(`📊 진행 표시: ${args.progressInterval}`)
  console.log(`💾 중간 저장: ${args.checkpointInterval} 또는 ${args.checkpointEvery.toLocaleString()}명마다`)
  if (args.checkpointOutput) {
    if (!dryRun && shouldWrite) {
      console.log('📝 output 중간 저장: 켜짐')
    } else {
      console.log('📝 output 중간 저장: 켜짐 (하지만 --write/--output이 없거나 dry-run이라서 파일은 안 써요)')
    }
  }
  console.log(`🧠 cache: ${cachePath}`)
  if (args.refresh) console.log('🔄 refresh: 캐시를 무시하고 다시 요청해요')
  if (args.limit) console.log(`🔎 limit: ${args.limit.toLocaleString()}명`)
  if (dryRun) console.log('🧯 dry-run: 출력 파일에 쓰지 않아요')
  console.log('—')

  const artistMap = readJsonFile(artistsPath, ArtistKeyMapSchema)
  const sponsors = readJsonFile(sponsorsPath, SponsorsMapSchema)

  const cacheDir = dirname(cachePath)
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true })
  }
  const cache = readJsonFileOrEmpty(cachePath, CacheSchema)

  let skippedNoCandidate = 0
  let skippedAlreadyHasX = 0

  let candidates: Candidate[] = []

  for (const artistKey of Object.keys(artistMap)) {
    const existing = sponsors[artistKey] ?? []
    if (hasXLink(existing)) {
      skippedAlreadyHasX += 1
      continue
    }

    const usernames = buildCandidateXUsernames(artistKey)
    if (usernames.length === 0) {
      skippedNoCandidate += 1
      continue
    }

    candidates.push({ artistKey, usernames })
  }

  if (args.limit) {
    candidates = candidates.slice(0, args.limit)
  }

  const totalArtists = Object.keys(artistMap).length
  console.log(
    `🔍 대상: ${candidates.length.toLocaleString()}명 (전체 ${totalArtists.toLocaleString()}명, 이미 X ${skippedAlreadyHasX.toLocaleString()}명, 후보 없음 ${skippedNoCandidate.toLocaleString()}명)`,
  )
  console.log('—')

  const shouldCheckpointOutput = args.checkpointOutput && !dryRun && shouldWrite

  let cacheWriteVersion = 0
  let lastFlushedCacheVersion = 0

  let outputWriteVersion = 0
  let lastFlushedOutputVersion = 0

  const inFlight = new Map<string, Promise<CacheEntry>>()

  const limit = pLimit(args.concurrency)

  const total = candidates.length
  const startedAt = Date.now()
  let lastProgressAt = 0

  let processed = 0
  let added = 0
  let missing = 0
  let unknown = 0

  let reused = 0
  let requested = 0

  let lastCacheCheckpointAt = startedAt
  let processedAtLastCacheCheckpoint = 0
  let lastOutputCheckpointAt = startedAt
  let processedAtLastOutputCheckpoint = 0

  let checkpointInFlight: Promise<void> | null = null

  function renderProgressLine() {
    const percent = total === 0 ? 100 : (processed / total) * 100
    const elapsedMs = Date.now() - startedAt
    const elapsedLabel = ms(elapsedMs)

    const elapsedSeconds = elapsedMs / ms('1s')
    const rate = elapsedSeconds > 0 ? processed / elapsedSeconds : 0
    const etaMs = rate > 0 ? ((total - processed) / rate) * ms('1s') : null
    const etaLabel = etaMs && Number.isFinite(etaMs) ? ms(Math.max(0, etaMs)) : null

    const pieces = [
      `⏳ ${processed.toLocaleString()}/${total.toLocaleString()} (${percent.toFixed(1)}%)`,
      `추가 ${added.toLocaleString()}`,
      `없음 ${missing.toLocaleString()}`,
      `불명 ${unknown.toLocaleString()}`,
      `캐시 ${reused.toLocaleString()}개`,
      `요청 ${requested.toLocaleString()}개`,
      `경과 ${elapsedLabel}`,
      ...(etaLabel ? [`남은 ${etaLabel}`] : []),
    ]

    return pieces.join(' · ')
  }

  function writeProgress(params2?: { force?: boolean; newline?: boolean }) {
    const { force = false, newline = false } = params2 ?? {}
    const now = Date.now()
    if (!force && now - lastProgressAt < progressIntervalMs) return
    lastProgressAt = now

    const line = renderProgressLine()
    if (!process.stdout.isTTY) {
      console.log(line)
      return
    }

    const clear = '\x1b[2K\r'
    if (newline) {
      process.stdout.write(`${clear}${line}\n`)
      return
    }
    process.stdout.write(`${clear}${line}`)
  }

  async function flushCheckpoint(params2: {
    flushCache: boolean
    flushOutput: boolean
    reason: 'every' | 'final' | 'interval' | 'signal'
  }) {
    const { flushCache, flushOutput, reason } = params2
    if (!flushCache && !flushOutput) return
    if (checkpointInFlight) return checkpointInFlight

    checkpointInFlight = (async () => {
      const shouldLog = reason !== 'final'
      if (shouldLog) {
        writeProgress({ force: true, newline: true })
      }

      const cacheVersionAtStart = cacheWriteVersion
      const outputVersionAtStart = outputWriteVersion

      const prevFlushedCacheVersion = lastFlushedCacheVersion
      const prevFlushedOutputVersion = lastFlushedOutputVersion

      if (flushCache) {
        const shouldSortCache = reason === 'final'
        writeJsonFile(cachePath, shouldSortCache ? sortObjectKeys(cache) : cache)

        lastFlushedCacheVersion = cacheVersionAtStart
        lastCacheCheckpointAt = Date.now()
        processedAtLastCacheCheckpoint = processed

        const newCacheWrites = cacheVersionAtStart - prevFlushedCacheVersion
        if (shouldLog && newCacheWrites > 0) {
          console.log(`💾 cache 중간 저장했어요 (+${newCacheWrites.toLocaleString()}개)`)
        }
      }

      if (flushOutput) {
        if (!existsSync(dirname(outputPath))) {
          mkdirSync(dirname(outputPath), { recursive: true })
        }
        writeJsonFile(outputPath, sponsors)

        lastFlushedOutputVersion = outputVersionAtStart
        lastOutputCheckpointAt = Date.now()
        processedAtLastOutputCheckpoint = processed

        const newOutputWrites = outputVersionAtStart - prevFlushedOutputVersion
        if (shouldLog) {
          const suffix = newOutputWrites > 0 ? ` (+${newOutputWrites.toLocaleString()}개)` : ''
          console.log(`📝 output 중간 저장했어요 (추가 ${added.toLocaleString()}명)${suffix}`)
        }
      }
    })().finally(() => {
      checkpointInFlight = null
    })

    return checkpointInFlight
  }

  function maybeFlushCheckpoint() {
    const now = Date.now()

    const cacheDirty = cacheWriteVersion !== lastFlushedCacheVersion
    const cacheIntervalDue = cacheDirty && now - lastCacheCheckpointAt >= checkpointIntervalMs
    const cacheEveryDue = cacheDirty && processed - processedAtLastCacheCheckpoint >= args.checkpointEvery
    const flushCache = cacheIntervalDue || cacheEveryDue

    const outputDirty = shouldCheckpointOutput && outputWriteVersion !== lastFlushedOutputVersion
    const outputFirstDue = outputDirty && lastFlushedOutputVersion === 0
    const outputIntervalDue = outputDirty && !outputFirstDue && now - lastOutputCheckpointAt >= checkpointIntervalMs
    const outputEveryDue =
      outputDirty && !outputFirstDue && processed - processedAtLastOutputCheckpoint >= args.checkpointEvery
    const flushOutput = outputFirstDue || outputIntervalDue || outputEveryDue

    if (!flushCache && !flushOutput) return

    const reason = cacheIntervalDue || outputIntervalDue ? 'interval' : 'every'
    void flushCheckpoint({ flushCache, flushOutput, reason })
  }

  async function resolveWithCache(username: string) {
    const key = username.trim().toLowerCase()
    const cached = cache[key]
    if (!args.refresh && cached && isFresh(cached, maxAgeMs)) {
      reused += 1
      return cached
    }

    const existingInFlight = inFlight.get(key)
    if (existingInFlight) {
      reused += 1
      return await existingInFlight
    }

    const task = (async () => {
      requested += 1
      const entry = await checkXWithRetry({ username: key, timeoutMs, retries: args.retries })
      cache[key] = entry
      cacheWriteVersion += 1
      return entry
    })().finally(() => {
      inFlight.delete(key)
    })

    inFlight.set(key, task)
    return await task
  }

  const signals: Array<'SIGINT' | 'SIGTERM'> = ['SIGINT', 'SIGTERM']
  const cleanupSignalHandlers: Array<() => void> = []
  for (const signal of signals) {
    const handler = () => {
      writeProgress({ force: true, newline: true })
      const flushCache = cacheWriteVersion !== lastFlushedCacheVersion
      const flushOutput = shouldCheckpointOutput && outputWriteVersion !== lastFlushedOutputVersion
      console.log(`🧯 ${signal}을 받아서 지금까지의 ${flushOutput ? 'cache/output' : 'cache'}를 저장하고 종료할게요`)
      void flushCheckpoint({ reason: 'signal', flushCache, flushOutput }).finally(() => {
        process.exit(signal === 'SIGINT' ? 130 : 143)
      })
    }
    process.on(signal, handler)
    cleanupSignalHandlers.push(() => process.off(signal, handler))
  }

  const progressTicker: ReturnType<typeof setInterval> | null =
    process.stdout.isTTY && progressIntervalMs > 0
      ? setInterval(() => {
          writeProgress({ force: true })
        }, progressIntervalMs)
      : null

  const tasks = candidates.map((candidate) =>
    limit(async () => {
      try {
        let result: CacheDecision = 'missing'
        let chosenUsername: string | null = null

        for (const u of candidate.usernames) {
          const entry = await resolveWithCache(u)
          if (entry.decision === 'exists') {
            result = 'exists'
            chosenUsername = u
            break
          }
          if (entry.decision === 'unknown') {
            result = 'unknown'
          }
        }

        if (result === 'exists' && chosenUsername) {
          const url = `https://x.com/${chosenUsername}`
          if (addXLink({ sponsors, artistKey: candidate.artistKey, url })) {
            added += 1
            outputWriteVersion += 1
          }
        } else if (result === 'unknown') {
          unknown += 1
        } else {
          missing += 1
        }
      } finally {
        processed += 1
        writeProgress()
        maybeFlushCheckpoint()
      }
    }),
  )

  writeProgress({ force: true, newline: true })

  try {
    await Promise.all(tasks)
  } finally {
    if (progressTicker) clearInterval(progressTicker)
    for (const cleanup of cleanupSignalHandlers) cleanup()
  }

  await flushCheckpoint({ reason: 'final', flushCache: true, flushOutput: false })
  writeProgress({ force: true, newline: true })

  const sortedSponsors = sortObjectKeys(sponsors)
  if (!dryRun) {
    if (!existsSync(dirname(outputPath))) {
      mkdirSync(dirname(outputPath), { recursive: true })
    }
    writeJsonFile(outputPath, sortedSponsors)
  }

  console.log('—')
  console.log(
    `✅ 완료했어요 (추가 ${added.toLocaleString()}명 · 없음 ${missing.toLocaleString()}명 · 불명 ${unknown.toLocaleString()}명 · 캐시 ${reused.toLocaleString()}개 · 요청 ${requested.toLocaleString()}개)`,
  )
  if (!dryRun) {
    console.log(`📝 출력: ${outputPath}`)
  }
  console.log('—')
}

function normalizeUrl(raw: string) {
  try {
    return new URL(raw).toString()
  } catch {
    return null
  }
}

function normalizeXUsername(value: string) {
  const v = value.trim().replace(/^@+/, '')
  if (!v) return null
  if (!XUsernameRegex.test(v)) return null
  return v.toLowerCase()
}

function parseArgs(argv: string[]): Args {
  const raw: Record<string, boolean | string> = {}

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i]
    if (!token?.startsWith('--')) continue

    const [flag, inlineValue] = token.split('=', 2)
    const key = flag.replace(/^--/, '')
    if (!key) continue

    if (inlineValue !== undefined) {
      raw[key] = inlineValue
      continue
    }

    const next = argv[i + 1]
    if (next && !next.startsWith('--')) {
      raw[key] = next
      i += 1
      continue
    }

    raw[key] = true
  }

  const parsed = ArgsSchema.safeParse({
    sponsors:
      typeof raw.sponsors === 'string' ? raw.sponsors : typeof raw.sponsor === 'string' ? raw.sponsor : undefined,
    artists: typeof raw.artists === 'string' ? raw.artists : typeof raw.artist === 'string' ? raw.artist : undefined,
    output: typeof raw.output === 'string' ? raw.output : undefined,
    write: raw.write === true,
    dryRun: raw['dry-run'] === true || raw.dryRun === true,
    limit: typeof raw.limit === 'string' ? Number(raw.limit) : undefined,
    concurrency: typeof raw.concurrency === 'string' ? Number(raw.concurrency) : undefined,
    timeout: typeof raw.timeout === 'string' ? raw.timeout : undefined,
    maxAge:
      typeof raw['max-age'] === 'string' ? raw['max-age'] : typeof raw.maxAge === 'string' ? raw.maxAge : undefined,
    retries: typeof raw.retries === 'string' ? Number(raw.retries) : undefined,
    cache: typeof raw.cache === 'string' ? raw.cache : undefined,
    refresh: raw.refresh === true,
    progressInterval:
      typeof raw['progress-interval'] === 'string'
        ? raw['progress-interval']
        : typeof raw.progressInterval === 'string'
          ? raw.progressInterval
          : undefined,
    checkpointInterval:
      typeof raw['checkpoint-interval'] === 'string'
        ? raw['checkpoint-interval']
        : typeof raw.checkpointInterval === 'string'
          ? raw.checkpointInterval
          : undefined,
    checkpointEvery:
      typeof raw['checkpoint-every'] === 'string'
        ? Number(raw['checkpoint-every'])
        : typeof raw.checkpointEvery === 'string'
          ? Number(raw.checkpointEvery)
          : undefined,
    checkpointOutput:
      raw['checkpoint-output'] === true ||
      raw['output-checkpoint'] === true ||
      raw.checkpointOutput === true ||
      raw.outputCheckpoint === true,
  })

  if (!parsed.success) {
    console.error('❌ 인자 파싱에 실패했어요')
    console.error(parsed.error.flatten().fieldErrors)
    console.log('')
    console.log('예시:')
    console.log('  bun tools/fillArtistXSponsors.ts')
    console.log('  bun tools/fillArtistXSponsors.ts -- --write --concurrency 2')
    console.log('  bun tools/fillArtistXSponsors.ts -- --output src/sponsor/artist.x.generated.json')
    console.log(
      '  bun tools/fillArtistXSponsors.ts -- --write --checkpoint-output --checkpoint-interval 30s --checkpoint-every 200',
    )
    console.log('  bun tools/fillArtistXSponsors.ts -- --write --limit 200 --dry-run')
    process.exit(1)
  }

  return parsed.data
}

function readJsonFile<T>(filePath: string, schema: z.ZodType<T>): T {
  const text = readFileSync(filePath, 'utf8')
  const json = JSON.parse(text) as unknown
  return schema.parse(json)
}

function readJsonFileOrEmpty<T extends object>(filePath: string, schema: z.ZodType<T>): T {
  if (!existsSync(filePath)) {
    return schema.parse({})
  }

  return readJsonFile(filePath, schema)
}

function safeJsonParse(text: string) {
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function sleep(durationMs: number) {
  return new Promise<void>((resolvePromise) => setTimeout(resolvePromise, durationMs))
}

function sortObjectKeys<T extends Record<string, unknown>>(obj: T): T {
  const out: Record<string, unknown> = {}
  for (const key of Object.keys(obj).sort((a, b) => a.localeCompare(b))) {
    out[key] = obj[key]
  }
  return out as T
}

function writeJsonFile(filePath: string, data: unknown) {
  const tmpPath = `${filePath}.${process.pid}.tmp`
  writeFileSync(tmpPath, `${JSON.stringify(data, null, 2)}\n`)
  try {
    renameSync(tmpPath, filePath)
  } catch (error) {
    const maybeCode = error && typeof error === 'object' ? (error as { code?: unknown }).code : undefined
    if (maybeCode === 'EEXIST' || maybeCode === 'EPERM') {
      try {
        rmSync(filePath)
      } catch {
        // ignore
      }
      renameSync(tmpPath, filePath)
      return
    }
    throw error
  }
}

main().catch((error) => {
  console.error(`❌ X 스폰서 자동 채우기 중 오류가 발생했어요: ${formatErrorForLog(error)}`)
  process.exit(1)
})
