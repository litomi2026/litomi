import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import ms from 'ms'
import pLimit from 'p-limit'
import { z } from 'zod'

type CacheEntry = {
  resolvedAt: string
  ok: boolean
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

const CacheEntrySchema: z.ZodType<CacheEntry> = z.object({
  resolvedAt: z.string(),
  ok: z.boolean(),
  status: z.number().int().nullable(),
  finalUrl: z.string().nullable(),
  error: z.string().optional(),
})

const CacheSchema: z.ZodType<CacheMap> = z.record(z.string(), CacheEntrySchema)

type EntityType = 'all' | 'artist' | 'character'

const ArgsSchema = z
  .object({
    type: z.enum(['artist', 'character', 'all']).default('artist'),
    input: z.string().optional(),
    output: z.string().optional(),
    write: z.boolean().default(false),
    dryRun: z.boolean().default(false),
    concurrency: z.number().int().positive().max(20).default(10),
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
    if (value.type === 'all' && (value.input || value.output)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '--type=all에서는 --input/--output을 사용할 수 없어요',
      })
    }

    if (value.input && value.output && value.write) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: '--write와 --output은 동시에 사용할 수 없어요 (--write는 입력 파일을 덮어써요)',
      })
    }
  })

type Args = z.infer<typeof ArgsSchema>

function applyResolvedUrls(params: { map: SponsorsMap; resolvedByOriginal: Map<string, string> }) {
  const { map, resolvedByOriginal } = params

  let changed = 0
  const out: SponsorsMap = {}

  for (const key of Object.keys(map)) {
    const links = map[key] ?? []
    const nextLinks: SponsorLink[] = []

    for (const link of links) {
      const resolved = resolvedByOriginal.get(link.value)
      if (resolved && resolved !== link.value) {
        nextLinks.push({ ...link, value: resolved })
        changed += 1
      } else {
        nextLinks.push(link)
      }
    }

    out[key] = nextLinks
  }

  return { map: out, changed }
}

function collectUniqueUrls(map: SponsorsMap) {
  const out = new Set<string>()
  for (const links of Object.values(map)) {
    for (const link of links) {
      if (link.value) out.add(link.value)
    }
  }
  return [...out]
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
  return join(process.cwd(), '.cache', 'sponsors', 'redirects.json')
}

function getDefaultInputPath(type: Exclude<EntityType, 'all'>) {
  return join(process.cwd(), 'src', 'sponsor', `${type}.json`)
}

function getRetryDelayMs(attempt: number) {
  return Math.min(ms('30s'), ms('500ms') * 2 ** attempt + Math.random() * ms('250ms'))
}

function isFresh(entry: CacheEntry, maxAgeMs: number) {
  const decidedAt = Date.parse(entry.resolvedAt)
  if (!Number.isFinite(decidedAt)) return false
  return decidedAt + maxAgeMs > Date.now()
}

function isPixivReturnToUrl(url: string) {
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')
    if (host !== 'pixiv.net') return false
    if (u.pathname !== '/') return false
    return u.searchParams.has('return_to')
  } catch {
    return false
  }
}

function isRetryableStatus(status: number) {
  return status === 429 || status === 500 || status === 502 || status === 503 || status === 504
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

  const cachePath = args.cache ? resolve(process.cwd(), args.cache) : getDefaultCachePath()

  const files: Array<{ inputPath: string; outputPath: string }> = []

  if (args.input) {
    const inputPath = resolve(process.cwd(), args.input)
    const outputPath = args.write ? inputPath : args.output ? resolve(process.cwd(), args.output) : inputPath
    files.push({ inputPath, outputPath })
  } else if (args.type === 'all') {
    const artist = getDefaultInputPath('artist')
    const character = getDefaultInputPath('character')
    files.push({ inputPath: artist, outputPath: artist })
    files.push({ inputPath: character, outputPath: character })
  } else {
    const inputPath = getDefaultInputPath(args.type)
    const outputPath = args.write ? inputPath : args.output ? resolve(process.cwd(), args.output) : inputPath
    files.push({ inputPath, outputPath })
  }

  if (!args.write && !args.output) {
    console.log('⚠️  --write/--output이 없어서 실제 파일은 덮어쓰지 않아요. (cache는 업데이트돼요)')
  }

  console.log('—')
  console.log(`🔁 대상: ${files.length}개 파일`)
  console.log(`⚙️  동시성: ${args.concurrency}`)
  console.log(`⏱️  timeout: ${args.timeout}`)
  console.log(`📊 진행 표시: ${args.progressInterval}`)
  console.log(`💾 중간 저장: ${args.checkpointInterval} 또는 ${args.checkpointEvery.toLocaleString()}개마다`)
  if (args.checkpointOutput) {
    const willWriteOutput = Boolean(args.write || args.output) && !args.dryRun
    if (willWriteOutput) {
      console.log('📝 output 중간 저장: 켜짐')
    } else {
      console.log('📝 output 중간 저장: 켜짐 (하지만 --write/--output이 없거나 dry-run이라서 파일은 안 써요)')
    }
  }
  console.log(`🧠 cache: ${cachePath}`)
  if (args.refresh) console.log('🔄 refresh: 캐시를 무시하고 다시 요청해요')
  if (args.dryRun) console.log('🧯 dry-run: 출력 파일에 쓰지 않아요')
  console.log('—')

  for (const file of files) {
    const shouldWrite = Boolean(args.write || args.output) && !args.dryRun
    const dryRun = args.dryRun || !shouldWrite

    const result = await resolveFile({
      inputPath: file.inputPath,
      outputPath: file.outputPath,
      dryRun,
      concurrency: args.concurrency,
      timeoutMs,
      cachePath,
      refresh: args.refresh,
      maxAgeMs,
      retries: args.retries,
      progressIntervalMs,
      checkpointIntervalMs,
      checkpointEvery: args.checkpointEvery,
      checkpointOutput: args.checkpointOutput,
    })

    console.log(
      `✅ ${result.inputPath} (URL ${result.totalUrls.toLocaleString()}개) → 변경 ${result.changedLinks.toLocaleString()}개, 캐시 재사용 ${result.reused.toLocaleString()}개, 새 해소 ${result.resolved.toLocaleString()}개, 실패 ${result.failed.toLocaleString()}개`,
    )
    if (!dryRun) {
      console.log(`📝 출력: ${result.outputPath}`)
    }
  }

  console.log('—')
  console.log('✅ 완료했어요')
  console.log('—')
}

function normalizeUrl(raw: string) {
  try {
    return new URL(raw).toString()
  } catch {
    return null
  }
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
    type: raw.type,
    input: typeof raw.input === 'string' ? raw.input : undefined,
    output: typeof raw.output === 'string' ? raw.output : undefined,
    write: raw.write === true,
    dryRun: raw['dry-run'] === true || raw.dryRun === true,
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
    console.log('  bun tools/resolveSponsorRedirects.ts -- --type artist --write --concurrency 3')
    console.log('  bun tools/resolveSponsorRedirects.ts -- --input src/sponsor/artist.generated.json --write')
    console.log('  bun tools/resolveSponsorRedirects.ts -- --type all --write --dry-run')
    console.log(
      '  bun tools/resolveSponsorRedirects.ts -- --type artist --write --progress-interval 1s --checkpoint-interval 30s --checkpoint-every 200',
    )
    console.log(
      '  bun tools/resolveSponsorRedirects.ts -- --type artist --write --checkpoint-output --checkpoint-interval 30s --checkpoint-every 200',
    )
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

async function resolveFile(params: {
  inputPath: string
  outputPath: string
  dryRun: boolean
  concurrency: number
  timeoutMs: number
  cachePath: string
  refresh: boolean
  maxAgeMs: number
  retries: number
  progressIntervalMs: number
  checkpointIntervalMs: number
  checkpointEvery: number
  checkpointOutput: boolean
}) {
  const {
    inputPath,
    outputPath,
    dryRun,
    concurrency,
    timeoutMs,
    cachePath,
    refresh,
    maxAgeMs,
    retries,
    progressIntervalMs,
    checkpointIntervalMs,
    checkpointEvery,
    checkpointOutput,
  } = params

  const input = readJsonFile(inputPath, SponsorsMapSchema)
  const urls = collectUniqueUrls(input)

  const cacheDir = dirname(cachePath)
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir, { recursive: true })
  }

  const cache = readJsonFileOrEmpty(cachePath, CacheSchema)

  const resolvedByOriginal = new Map<string, string>()

  let processed = 0
  let resolved = 0
  let reused = 0
  let failed = 0

  const shouldCheckpointOutput = checkpointOutput && !dryRun

  let cacheWriteVersion = 0
  let lastFlushedCacheVersion = 0

  let outputWriteVersion = 0
  let lastFlushedOutputVersion = 0

  const limit = pLimit(concurrency)

  const total = urls.length
  const startedAt = Date.now()
  let lastProgressAt = 0

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
      `캐시 ${reused.toLocaleString()}`,
      `해소 ${resolved.toLocaleString()}`,
      `실패 ${failed.toLocaleString()}`,
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

  function adoptResolvedUrl(originalUrl: string, finalUrl: string) {
    const prev = resolvedByOriginal.get(originalUrl)
    if (prev === finalUrl) return false
    resolvedByOriginal.set(originalUrl, finalUrl)
    outputWriteVersion += 1
    return true
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
        const applied = applyResolvedUrls({ map: input, resolvedByOriginal })
        if (!existsSync(dirname(outputPath))) {
          mkdirSync(dirname(outputPath), { recursive: true })
        }
        writeJsonFile(outputPath, applied.map)

        lastFlushedOutputVersion = outputVersionAtStart
        lastOutputCheckpointAt = Date.now()
        processedAtLastOutputCheckpoint = processed

        const newOutputWrites = outputVersionAtStart - prevFlushedOutputVersion
        if (shouldLog) {
          const suffix = newOutputWrites > 0 ? ` (+${newOutputWrites.toLocaleString()}개)` : ''
          console.log(`📝 output 중간 저장했어요 (링크 변경 ${applied.changed.toLocaleString()}개)${suffix}`)
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
    const cacheEveryDue = cacheDirty && processed - processedAtLastCacheCheckpoint >= checkpointEvery
    const flushCache = cacheIntervalDue || cacheEveryDue

    const outputDirty = shouldCheckpointOutput && outputWriteVersion !== lastFlushedOutputVersion
    const outputFirstDue = outputDirty && lastFlushedOutputVersion === 0
    const outputIntervalDue = outputDirty && !outputFirstDue && now - lastOutputCheckpointAt >= checkpointIntervalMs
    const outputEveryDue =
      outputDirty && !outputFirstDue && processed - processedAtLastOutputCheckpoint >= checkpointEvery
    const flushOutput = outputFirstDue || outputIntervalDue || outputEveryDue

    if (!flushCache && !flushOutput) return

    const reason = cacheIntervalDue || outputIntervalDue ? 'interval' : 'every'
    void flushCheckpoint({ flushCache, flushOutput, reason })
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

  const tasks = urls.map((originalUrl) =>
    limit(async () => {
      try {
        const cached = cache[originalUrl]
        if (!refresh && cached && cached.ok && isFresh(cached, maxAgeMs) && cached.finalUrl) {
          if (shouldAdoptResolvedUrl(originalUrl, cached.finalUrl)) {
            adoptResolvedUrl(originalUrl, cached.finalUrl)
          }
          reused += 1
          return
        }

        const entry = await resolveFinalUrlWithRetry({ originalUrl, timeoutMs, retries })
        cache[originalUrl] = entry
        cacheWriteVersion += 1

        if (entry.ok && entry.finalUrl) {
          if (shouldAdoptResolvedUrl(originalUrl, entry.finalUrl)) {
            adoptResolvedUrl(originalUrl, entry.finalUrl)
          }
          resolved += 1
        } else {
          failed += 1
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

  const applied = applyResolvedUrls({ map: input, resolvedByOriginal })
  const sorted = sortObjectKeys(applied.map)

  if (!dryRun) {
    if (!existsSync(dirname(outputPath))) {
      mkdirSync(dirname(outputPath), { recursive: true })
    }
    writeJsonFile(outputPath, sorted)
  }

  return {
    inputPath,
    outputPath,
    totalUrls: urls.length,
    processed,
    resolved,
    reused,
    failed,
    changedLinks: applied.changed,
    dryRun,
  }
}

async function resolveFinalUrlOnce(originalUrl: string, timeoutMs: number) {
  const headers: Record<string, string> = {
    Accept: '*/*',
    'User-Agent': 'litomi-sponsor-redirect-resolver/1.0',
  }

  const head = await fetchWithTimeout(originalUrl, { method: 'HEAD', redirect: 'follow', headers }, timeoutMs)
  head.body?.cancel()

  // Some providers reject HEAD; fall back to GET in that case.
  if (head.status === 405 || head.status === 403) {
    const get = await fetchWithTimeout(originalUrl, { method: 'GET', redirect: 'follow', headers }, timeoutMs)
    get.body?.cancel()
    return { status: get.status, finalUrl: normalizeUrl(get.url) }
  }

  return { status: head.status, finalUrl: normalizeUrl(head.url) }
}

async function resolveFinalUrlWithRetry(params: {
  originalUrl: string
  timeoutMs: number
  retries: number
}): Promise<CacheEntry> {
  const { originalUrl, timeoutMs, retries } = params

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    try {
      const { status, finalUrl } = await resolveFinalUrlOnce(originalUrl, timeoutMs)
      const ok = status >= 200 && status < 400

      if (ok || attempt === retries || !isRetryableStatus(status)) {
        return {
          resolvedAt: new Date().toISOString(),
          ok,
          status,
          finalUrl,
          ...(ok ? {} : { error: `HTTP ${status}` }),
        }
      }

      await sleep(getRetryDelayMs(attempt))
    } catch (error) {
      if (attempt === retries) {
        return {
          resolvedAt: new Date().toISOString(),
          ok: false,
          status: null,
          finalUrl: null,
          error: formatErrorForLog(error),
        }
      }
      await sleep(getRetryDelayMs(attempt))
    }
  }

  return {
    resolvedAt: new Date().toISOString(),
    ok: false,
    status: null,
    finalUrl: null,
    error: '알 수 없는 오류로 리다이렉트 해소에 실패했어요',
  }
}

function shouldAdoptResolvedUrl(originalUrl: string, finalUrl: string) {
  if (originalUrl === finalUrl) {
    return false
  }

  // Pixiv stacc 같은 케이스는 최종 URL이 `/?return_to=...`로 떨어지는데,
  // 이건 "로그인이 필요해요"를 의미하는 게이트라서 덮어쓸 필요가 없어요.
  if (isPixivReturnToUrl(finalUrl)) {
    return false
  }

  return true
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
  console.error(`❌ 리다이렉트 해소 중 오류가 발생했어요: ${formatErrorForLog(error)}`)
  process.exit(1)
})
