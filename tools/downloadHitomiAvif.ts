import { appendFile, mkdir, mkdtemp, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

type CurlInfo = {
  hasHttp2: boolean
  hasHttp3: boolean
  path: string
  version: string
}

type CurlRunResult = {
  exitCode: number
  stderr: string
  timedOutAfterNoProgress: boolean
}

type DownloadJob = {
  candidateUrls?: string[]
  format: 'avif' | 'webp'
  output: string
  referer: string
  url: string
}

type FetchTextError = Error & {
  status: number
  url: string
}

type GalleryFile = {
  hasavif?: boolean | number
  hash: string
  height?: number
  name: string
  width?: number
}

type GalleryInfo = {
  files: GalleryFile[]
  id?: number | string
}

type GgInfo = {
  b: string
  caseValue: number
  defaultValue: number
  mCases: Set<number>
}

type Options = {
  allowWebpFallback: boolean
  attemptTimeoutSeconds: number
  curlPath?: string
  dryRun: boolean
  inputFiles: string[]
  limit?: number
  metadataParallel: number
  outDir: string
  overwrite: boolean
  parallel: number
  ranges: RangeSpec[]
  retryRounds: number
  targets: string[]
  transport: Transport
}

type PendingDownloadJob = Omit<DownloadJob, 'url'> & {
  file: GalleryFile
}

type ProbeResult = 'found' | 'missing' | 'unknown'

type RangeSpec = {
  end: number
  start: number
}

type SkipKind = 'download' | 'file' | 'gallery'

type SkipLogEntry = {
  candidateUrls?: string[]
  detail?: string
  hash?: string
  kind: SkipKind
  output?: string
  readerId?: string
  reason: string
  source?: string
  url?: string
}

type SkipLogger = {
  count: number
  path?: string
  write: (entry: SkipLogEntry) => Promise<void>
}

type Transport = 'auto' | 'http2' | 'http3-only' | 'http3'

const defaultOutDir = 'downloads/hitomi'
const domain = 'gold-usergeneratedcontent.net'
const galleryHost = `https://ltn.${domain}`
const hitomiOrigin = 'https://hitomi.la/'
const textDecoder = new TextDecoder()
const userAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36'

const usage = () => {
  console.log(`Usage:
  bun tools/downloadHitomiAvif.ts [options] <reader-url-or-id> [...]

Options:
  --input <file>             Read reader URLs/ids from a newline-delimited file. Use - for stdin.
  --range <start:end>        Process reader ids inclusively without expanding them in memory.
  --out <dir>                Output directory. Default: ${defaultOutDir}
  --parallel <n>             curl transfer concurrency. Default: 4
  --metadata-parallel <n>    Gallery metadata fetch concurrency. Default: 8
  --retry-rounds <n>         Script-level retry rounds with lower concurrency. Default: 4
  --attempt-timeout <sec>    Kill curl after this many seconds without file progress. Default: 60
  --limit <n>                Download only the first n files per gallery.
  --overwrite                Redownload existing files instead of skipping them.
  --dry-run                  Print planned jobs without downloading.
  --allow-webp-fallback      Save WebP when a gallery file has no AVIF.
  --http2                    Force HTTP/2 curl.
  --http3                    Force HTTP/3 curl.
  --http3-only               Force HTTP/3 only curl.
  --curl <path>              curl binary path. Default prefers /opt/homebrew/opt/curl/bin/curl.
  --help                     Show this help.
`)
}

const parsePositiveInt = (name: string, value: string) => {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer: ${value}`)
  }
  return parsed
}

const parseRange = (value: string): RangeSpec => {
  const match = /^(\d+):(\d+)$/.exec(value)
  if (!match) {
    throw new Error(`--range must be in start:end format: ${value}`)
  }

  const start = parsePositiveInt('--range start', match[1])
  const end = parsePositiveInt('--range end', match[2])
  if (start > end) {
    throw new Error(`--range start must be <= end: ${value}`)
  }

  return {
    end,
    start,
  }
}

const createSkipLogger = async (outDir: string, enabled: boolean): Promise<SkipLogger> => {
  const path = enabled ? join(outDir, `hitomi-skipped-${Date.now()}.txt`) : undefined
  if (path) {
    await mkdir(outDir, { recursive: true })
    await appendFile(path, `# Hitomi skipped entries\n# ${new Date().toISOString()}\n`)
  }

  const logger: SkipLogger = {
    count: 0,
    path,
    write: async (entry) => {
      logger.count++
      if (!path) {
        return
      }

      await appendFile(
        path,
        `${JSON.stringify({
          timestamp: new Date().toISOString(),
          ...entry,
        })}\n`,
      )
    },
  }

  return logger
}

const errorReason = (error: unknown) => (error instanceof Error ? error.message : String(error))

const takeValue = (args: string[], index: number, name: string) => {
  const value = args[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} requires a value`)
  }
  return value
}

const parseArgs = (args: string[]): Options => {
  const options: Options = {
    allowWebpFallback: false,
    attemptTimeoutSeconds: 10,
    dryRun: false,
    inputFiles: [],
    metadataParallel: 8,
    outDir: defaultOutDir,
    overwrite: false,
    parallel: 4,
    ranges: [],
    retryRounds: 4,
    targets: [],
    transport: 'auto',
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]

    if (arg === '--help' || arg === '-h') {
      usage()
      process.exit(0)
    } else if (arg === '--input') {
      options.inputFiles.push(takeValue(args, i, arg))
      i++
    } else if (arg === '--range') {
      options.ranges.push(parseRange(takeValue(args, i, arg)))
      i++
    } else if (arg === '--out') {
      options.outDir = takeValue(args, i, arg)
      i++
    } else if (arg === '--parallel') {
      options.parallel = parsePositiveInt(arg, takeValue(args, i, arg))
      i++
    } else if (arg === '--metadata-parallel') {
      options.metadataParallel = parsePositiveInt(arg, takeValue(args, i, arg))
      i++
    } else if (arg === '--retry-rounds') {
      options.retryRounds = parsePositiveInt(arg, takeValue(args, i, arg))
      i++
    } else if (arg === '--attempt-timeout') {
      options.attemptTimeoutSeconds = parsePositiveInt(arg, takeValue(args, i, arg))
      i++
    } else if (arg === '--limit') {
      options.limit = parsePositiveInt(arg, takeValue(args, i, arg))
      i++
    } else if (arg === '--curl') {
      options.curlPath = takeValue(args, i, arg)
      i++
    } else if (arg === '--overwrite') {
      options.overwrite = true
    } else if (arg === '--dry-run') {
      options.dryRun = true
    } else if (arg === '--allow-webp-fallback') {
      options.allowWebpFallback = true
    } else if (arg === '--http2') {
      options.transport = 'http2'
    } else if (arg === '--http3') {
      options.transport = 'http3'
    } else if (arg === '--http3-only') {
      options.transport = 'http3-only'
    } else if (arg.startsWith('--')) {
      throw new Error(`Unknown option: ${arg}`)
    } else {
      options.targets.push(arg)
    }
  }

  return options
}

const readInputTargets = async (inputFiles: string[]) => {
  const targets: string[] = []
  for (const inputFile of inputFiles) {
    const text = inputFile === '-' ? await Bun.stdin.text() : await Bun.file(inputFile).text()
    for (const line of text.split(/\r?\n/)) {
      const target = line.trim()
      if (target && !target.startsWith('#')) {
        targets.push(target)
      }
    }
  }
  return targets
}

const readerIdFromTarget = (target: string) => {
  if (/^\d+$/.test(target)) {
    return target
  }

  const match = /\/reader\/(\d+)\.html(?:[#?].*)?$/.exec(target)
  if (!match) {
    throw new Error(`Cannot extract reader id from: ${target}`)
  }
  return match[1]
}

const readerUrlFromId = (readerId: string) => `https://hitomi.la/reader/${readerId}.html`

const fetchText = async (url: string) => {
  const response = await fetch(url, {
    headers: {
      'user-agent': userAgent,
    },
  })
  if (!response.ok) {
    throw Object.assign(new Error(`GET ${url} failed: ${response.status} ${response.statusText}`), {
      status: response.status,
      url,
    })
  }
  return response.text()
}

const isFetchTextError = (error: unknown): error is FetchTextError => {
  if (!(error instanceof Error)) {
    return false
  }
  const candidate = error as Partial<FetchTextError>
  return typeof candidate.status === 'number' && typeof candidate.url === 'string'
}

const parseGalleryInfo = (script: string) => {
  const match = /var\s+galleryinfo\s*=\s*(\{[\s\S]*\})\s*;?\s*$/.exec(script.trim())
  if (!match) {
    throw new Error('Could not parse galleryinfo script')
  }
  const parsed = JSON.parse(match[1]) as GalleryInfo
  if (!Array.isArray(parsed.files)) {
    throw new Error('galleryinfo.files is missing')
  }
  return parsed
}

const parseGgInfo = (script: string): GgInfo => {
  const defaultMatch = /var\s+o\s*=\s*(\d+)/.exec(script)
  if (!defaultMatch) {
    throw new Error('Could not parse gg.m default value')
  }

  const caseValueMatch = /o\s*=\s*(\d+)\s*;\s*break\s*;/.exec(script)
  if (!caseValueMatch) {
    throw new Error('Could not parse gg.m case value')
  }

  const bMatch = /b:\s*['"]([^'"]+)['"]/.exec(script)
  if (!bMatch) {
    throw new Error('Could not parse gg.b')
  }

  const mCases = new Set<number>()
  for (const match of script.matchAll(/case\s+(\d+)\s*:/g)) {
    mCases.add(Number.parseInt(match[1], 10))
  }

  return {
    b: bMatch[1],
    caseValue: Number.parseInt(caseValueMatch[1], 10),
    defaultValue: Number.parseInt(defaultMatch[1], 10),
    mCases,
  }
}

const ggS = (hash: string) => Number.parseInt(`${hash.at(-1)}${hash.slice(-3, -1)}`, 16).toString(10)

const ggM = (gg: GgInfo, hash: string) => {
  const g = Number.parseInt(`${hash.at(-1)}${hash.slice(-3, -1)}`, 16)
  return gg.mCases.has(g) ? gg.caseValue : gg.defaultValue
}

const cdnUrlFromHash = (gg: GgInfo, file: GalleryFile, format: 'avif' | 'webp') => {
  const prefix = format === 'avif' ? 'a' : 'w'
  const subdomain = `${prefix}${1 + ggM(gg, file.hash)}`
  return `https://${subdomain}.${domain}/${gg.b}${ggS(file.hash)}/${file.hash}.${format}`
}

const alternateCdnUrl = (url: string) =>
  url.replace(/https:\/\/([aw])([12])\./, (_match, prefix, n) => `https://${prefix}${n === '1' ? '2' : '1'}.`)

const ggBaseCandidates = (base: string) => {
  const candidates = [base]
  const numericBase = Number.parseInt(base.replace(/\/$/, ''), 10)
  if (Number.isSafeInteger(numericBase)) {
    for (const offset of [3601, 3600, 3599, 7202, 7200, 7198]) {
      candidates.push(`${numericBase - offset}/`)
    }
  }
  return [...new Set(candidates)]
}

const probeCdnUrl = async (url: string) => {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          referer: hitomiOrigin,
          'user-agent': userAgent,
        },
        method: 'HEAD',
      })
      if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
        return true
      }
      if (response.status === 404) {
        return false
      }
    } catch {
      // CDN edges can reject short bursts of probes; retry before giving up.
    }
    await sleep(250 * (attempt + 1))
  }
  return false
}

const probeCdnUrlStatus = async (url: string): Promise<ProbeResult> => {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(url, {
        headers: {
          referer: hitomiOrigin,
          'user-agent': userAgent,
        },
        method: 'HEAD',
      })
      if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
        return 'found'
      }
      if (response.status === 404) {
        return 'missing'
      }
    } catch {
      // Leave transient CDN/protocol errors as unknown so retries keep the best URL.
    }
    await sleep(200 * (attempt + 1))
  }
  return 'unknown'
}

const resolveGgForGallery = async (params: {
  allowWebpFallback: boolean
  gallery: GalleryInfo
  gg: GgInfo
  readerId: string
}) => {
  const { allowWebpFallback, gallery, gg, readerId } = params
  const probeFile = gallery.files.find((file) => file.hasavif || allowWebpFallback)
  if (!probeFile) {
    return gg
  }
  const format = probeFile.hasavif ? 'avif' : 'webp'

  for (const b of ggBaseCandidates(gg.b)) {
    const candidate = {
      ...gg,
      b,
    }
    if (await probeCdnUrl(cdnUrlFromHash(candidate, probeFile, format))) {
      return candidate
    }
  }

  const fallbackBase = ggBaseCandidates(gg.b)[1] ?? gg.b
  console.warn(`Could not verify CDN base for reader ${readerId}; trying ${fallbackBase} first and rotating fallbacks`)
  return {
    ...gg,
    b: fallbackBase,
  }
}

const cdnUrlCandidatesFromFile = (params: {
  baseCandidates: string[]
  file: GalleryFile
  format: 'avif' | 'webp'
  gg: GgInfo
}) => {
  const candidates: string[] = []
  for (const b of params.baseCandidates) {
    const url = cdnUrlFromHash(
      {
        ...params.gg,
        b,
      },
      params.file,
      params.format,
    )
    candidates.push(url, alternateCdnUrl(url))
  }
  return [...new Set(candidates)]
}

const fileExists = async (path: string) => {
  try {
    const current = await stat(path)
    return current.isFile() && current.size > 0
  } catch {
    return false
  }
}

const mapLimit = async <T, R>(items: T[], limit: number, mapper: (item: T, index: number) => Promise<R>) => {
  const results = new Array<R>(items.length)
  let nextIndex = 0
  const workerCount = Math.min(limit, items.length)

  await Promise.all(
    Array.from({ length: workerCount }, async () => {
      while (nextIndex < items.length) {
        const index = nextIndex
        nextIndex++
        results[index] = await mapper(items[index], index)
      }
    }),
  )

  return results
}

const buildJobsForGallery = async (params: {
  allowWebpFallback: boolean
  dryRun: boolean
  gg: GgInfo
  limit?: number
  outDir: string
  overwrite: boolean
  readerId: string
  skipLogger: SkipLogger
}) => {
  const { allowWebpFallback, dryRun, gg, limit, outDir, overwrite, readerId } = params
  const galleryScript = await fetchText(`${galleryHost}/galleries/${readerId}.js`)
  const gallery = parseGalleryInfo(galleryScript)
  const actualId = String(gallery.id ?? readerId)
  const folderId = actualId === readerId ? readerId : `${readerId}-${actualId}`
  const galleryDir = join(outDir, folderId)
  const files = typeof limit === 'number' ? gallery.files.slice(0, limit) : gallery.files
  const jobs: DownloadJob[] = []
  const pendingJobs: PendingDownloadJob[] = []
  let skippedExisting = 0
  let skippedNoAvif = 0

  if (actualId !== readerId) {
    if (!dryRun) {
      await mkdir(galleryDir, { recursive: true })
    }
    await params.skipLogger.write({
      detail: `${readerId} aliases canonical gallery ${actualId}; ${
        dryRun ? `would create ${galleryDir}` : `created ${galleryDir}`
      } and skipped ${files.length} files`,
      kind: 'gallery',
      readerId,
      reason: 'alias reader id; canonical gallery id will be downloaded separately',
      url: readerUrlFromId(readerId),
    })

    return {
      actualId,
      aliasSkipped: true,
      base: gg.b,
      galleryDir,
      jobs,
      readerId,
      skippedExisting,
      skippedNoAvif,
      totalFiles: files.length,
    }
  }

  const workingGg = await resolveGgForGallery({
    allowWebpFallback,
    gallery,
    gg,
    readerId,
  })
  const baseCandidates = [...new Set([workingGg.b, ...ggBaseCandidates(gg.b), ...ggBaseCandidates(workingGg.b)])]

  for (let index = 0; index < files.length; index++) {
    const file = files[index]
    const format = file.hasavif ? 'avif' : allowWebpFallback ? 'webp' : undefined
    if (!format) {
      skippedNoAvif++
      await params.skipLogger.write({
        hash: file.hash,
        kind: 'file',
        readerId,
        reason: 'no AVIF available and --allow-webp-fallback was not enabled',
        source: file.name,
      })
      continue
    }

    const output = join(galleryDir, `${index + 1}.${format}`)
    if (!overwrite && (await fileExists(output))) {
      skippedExisting++
      continue
    }

    pendingJobs.push({
      file,
      format,
      output,
      referer: readerUrlFromId(readerId),
    })
  }

  const resolvedJobs = pendingJobs.map((job) => {
    const candidateUrls = cdnUrlCandidatesFromFile({
      baseCandidates,
      file: job.file,
      format: job.format,
      gg: workingGg,
    })
    return {
      candidateUrls,
      format: job.format,
      output: job.output,
      referer: job.referer,
      url: candidateUrls[0],
    }
  })
  jobs.push(...resolvedJobs)

  return {
    actualId,
    aliasSkipped: false,
    base: workingGg.b,
    galleryDir,
    jobs,
    readerId,
    skippedExisting,
    skippedNoAvif,
    totalFiles: files.length,
  }
}

const spawnSyncText = (cmd: string[]) => {
  try {
    const result = Bun.spawnSync(cmd, {
      stderr: 'pipe',
      stdout: 'pipe',
    })
    if (result.exitCode !== 0) {
      return undefined
    }
    return textDecoder.decode(result.stdout)
  } catch {
    return undefined
  }
}

const detectCurl = (preferred?: string): CurlInfo => {
  const candidates = [preferred, process.env.CURL, '/opt/homebrew/opt/curl/bin/curl', 'curl', '/usr/bin/curl'].filter(
    (candidate): candidate is string => Boolean(candidate),
  )
  const seen = new Set<string>()

  for (const candidate of candidates) {
    if (seen.has(candidate)) {
      continue
    }
    seen.add(candidate)

    const version = spawnSyncText([candidate, '--version'])
    if (!version) {
      continue
    }

    return {
      hasHttp2: /\bHTTP2\b/.test(version),
      hasHttp3: /\bHTTP3\b/.test(version),
      path: candidate,
      version: version.trim(),
    }
  }

  throw new Error('Could not find a runnable curl binary')
}

const transportOption = (curl: CurlInfo, transport: Transport) => {
  if (transport === 'auto') {
    if (curl.hasHttp3) {
      return 'http3'
    }
    if (curl.hasHttp2) {
      return 'http2'
    }
    return undefined
  }

  if (transport === 'http3' && !curl.hasHttp3) {
    throw new Error(`${curl.path} does not support HTTP/3`)
  }
  if (transport === 'http3-only' && !curl.hasHttp3) {
    throw new Error(`${curl.path} does not support HTTP/3`)
  }
  if (transport === 'http2' && !curl.hasHttp2) {
    throw new Error(`${curl.path} does not support HTTP/2`)
  }

  return transport
}

const curlQuote = (value: string) => `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`

const writeCurlConfig = async (params: {
  configPath: string
  jobs: DownloadJob[]
  parallel: number
  protocol?: string
}) => {
  const { configPath, jobs, parallel, protocol } = params
  const lines = [
    'fail',
    'location',
    'show-error',
    'silent',
    'parallel',
    `parallel-max = ${curlQuote(String(parallel))}`,
    'retry = "8"',
    'retry-delay = "2"',
    'retry-max-time = "120"',
    'connect-timeout = "15"',
    'remove-on-error',
    'speed-time = "30"',
    'speed-limit = "1024"',
    'create-dirs',
    `referer = ${curlQuote(hitomiOrigin)}`,
    `user-agent = ${curlQuote(userAgent)}`,
  ]

  if (protocol) {
    lines.push(protocol)
  }

  for (const job of jobs) {
    lines.push(`url = ${curlQuote(job.url)}`)
    lines.push(`output = ${curlQuote(job.output)}`)
  }

  await Bun.write(configPath, `${lines.join('\n')}\n`)
}

const countMissingJobs = async (jobs: DownloadJob[]) => {
  let missing = 0
  for (const job of jobs) {
    if (!(await fileExists(job.output))) {
      missing++
    }
  }
  return missing
}

const runCurl = async (params: {
  configPath: string
  curl: CurlInfo
  jobs: DownloadJob[]
  noProgressTimeoutMs: number
}): Promise<CurlRunResult> => {
  const { configPath, curl, jobs, noProgressTimeoutMs } = params
  const proc = Bun.spawn([curl.path, '--config', configPath], {
    stderr: 'pipe',
    stdin: 'inherit',
    stdout: 'pipe',
  })

  const stderrPromise = new Response(proc.stderr).text()
  let monitorDone = false
  let timedOutAfterNoProgress = false

  const monitorProgress = async (): Promise<'complete' | 'no-progress'> => {
    let lastMissing = await countMissingJobs(jobs)
    if (lastMissing === 0) {
      return 'complete'
    }
    let lastProgressAt = Date.now()

    while (!monitorDone) {
      await sleep(5000)
      if (monitorDone) {
        return 'complete'
      }

      const currentMissing = await countMissingJobs(jobs)
      if (currentMissing === 0) {
        return 'complete'
      }

      if (currentMissing < lastMissing) {
        lastMissing = currentMissing
        lastProgressAt = Date.now()
        continue
      }

      if (Date.now() - lastProgressAt >= noProgressTimeoutMs) {
        return 'no-progress'
      }
    }

    return 'complete'
  }

  const monitorPromise = monitorProgress()
  const exitOrMonitor = await Promise.race([proc.exited, monitorPromise])
  if (exitOrMonitor === 'no-progress') {
    timedOutAfterNoProgress = true
    monitorDone = true
    proc.kill()
    const exitCode = await Promise.race([proc.exited, sleep(5000).then(() => -1)])
    const stderr = await Promise.race([stderrPromise, sleep(1000).then(() => '')])
    return {
      exitCode,
      stderr,
      timedOutAfterNoProgress,
    }
  }

  if (exitOrMonitor === 'complete') {
    monitorDone = true
    const exitCode = await Promise.race([proc.exited, sleep(5000).then(() => 0)])
    if (exitCode === 0) {
      proc.kill()
    }
    const stderr = await Promise.race([stderrPromise, sleep(1000).then(() => '')])
    return {
      exitCode,
      stderr,
      timedOutAfterNoProgress,
    }
  }

  monitorDone = true
  await monitorPromise
  const stderr = await Promise.race([stderrPromise, sleep(1000).then(() => '')])

  return {
    exitCode: exitOrMonitor,
    stderr,
    timedOutAfterNoProgress,
  }
}

const summarizeCurlStderr = (stderr: string) => {
  const lines = stderr
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) {
    return
  }

  const counts = new Map<string, number>()
  for (const line of lines) {
    counts.set(line, (counts.get(line) ?? 0) + 1)
  }

  for (const [line, count] of counts) {
    console.warn(count === 1 ? line : `${line} (x${count})`)
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const missingJobs = async (jobs: DownloadJob[]) => {
  const remaining: DownloadJob[] = []
  for (const job of jobs) {
    if (!(await fileExists(job.output))) {
      remaining.push(job)
    }
  }
  return remaining
}

const rotateMissingJobUrls = (jobs: DownloadJob[]) =>
  jobs.map((job) => {
    if (!job.candidateUrls?.length) {
      return job
    }

    const currentIndex = job.candidateUrls.indexOf(job.url)
    const nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % job.candidateUrls.length

    return {
      ...job,
      url: job.candidateUrls[nextIndex],
    }
  })

const refreshMissingJobUrls = async (jobs: DownloadJob[]) => {
  let foundCurrent = 0
  let foundFallback = 0
  let keptUnknown = 0
  let rotatedWithoutProbe = 0

  const refreshed = await mapLimit(jobs, Math.min(16, Math.max(1, jobs.length)), async (job) => {
    if (!job.candidateUrls?.length) {
      return job
    }

    const candidates = job.candidateUrls
    for (let index = 0; index < candidates.length; index++) {
      const candidateUrl = candidates[index]
      const probe = await probeCdnUrlStatus(candidateUrl)

      if (probe === 'found') {
        if (candidateUrl === job.url) {
          foundCurrent++
        } else {
          foundFallback++
        }
        return {
          ...job,
          url: candidateUrl,
        }
      }

      if (probe === 'unknown' && candidateUrl === candidates[0]) {
        keptUnknown++
        return {
          ...job,
          url: candidateUrl,
        }
      }
    }

    rotatedWithoutProbe++
    return rotateMissingJobUrls([job])[0]
  })

  console.warn(
    `retry URL check: ${foundCurrent} current ok, ${foundFallback} fallback ok, ${keptUnknown} kept current unknown, ${rotatedWithoutProbe} rotated without a verified candidate`,
  )

  return refreshed
}

const retryParallelForAttempt = (initialParallel: number, attemptIndex: number) =>
  Math.max(1, Math.floor(initialParallel / 2 ** attemptIndex))

const protocolForAttempt = (params: {
  attemptIndex: number
  curl: CurlInfo
  initialProtocol?: string
  retryRounds: number
  transport: Transport
}) => {
  const { attemptIndex, curl, initialProtocol, retryRounds, transport } = params
  if (
    retryRounds > 1 &&
    transport === 'auto' &&
    initialProtocol === 'http3' &&
    curl.hasHttp2 &&
    attemptIndex === retryRounds - 1
  ) {
    return 'http2'
  }
  return initialProtocol
}

const downloadWithRetries = async (params: {
  attemptTimeoutSeconds: number
  curl: CurlInfo
  initialProtocol?: string
  jobs: DownloadJob[]
  outDir: string
  parallel: number
  retryRounds: number
  skipLogger: SkipLogger
  tempDir: string
  transport: Transport
}) => {
  const { curl, initialProtocol, retryRounds, tempDir, transport } = params
  let remaining = params.jobs

  for (let attemptIndex = 0; attemptIndex < retryRounds; attemptIndex++) {
    const attempt = attemptIndex + 1
    const attemptParallel = Math.min(remaining.length, retryParallelForAttempt(params.parallel, attemptIndex))
    const protocol = protocolForAttempt({
      attemptIndex,
      curl,
      initialProtocol,
      retryRounds,
      transport,
    })
    const configPath = join(tempDir, `curl-${attempt}.conf`)

    console.log(
      `download attempt ${attempt}/${retryRounds}: ${remaining.length} files, parallel=${attemptParallel}, transport=${
        protocol ?? 'curl default'
      }`,
    )

    await writeCurlConfig({
      configPath,
      jobs: remaining,
      parallel: attemptParallel,
      protocol,
    })

    try {
      const result = await runCurl({
        configPath,
        curl,
        jobs: remaining,
        noProgressTimeoutMs: params.attemptTimeoutSeconds * 1000,
      })
      if (result.timedOutAfterNoProgress) {
        console.warn(
          `curl attempt ${attempt} had no completed files for ${params.attemptTimeoutSeconds}s; retrying missing files`,
        )
      }
      if (result.exitCode !== 0) {
        summarizeCurlStderr(result.stderr)
      }
    } catch (error) {
      console.warn(`curl execution failed on attempt ${attempt}: ${errorReason(error)}`)
    }

    remaining = await missingJobs(remaining)
    if (!remaining.length) {
      return
    }

    console.warn(`${remaining.length} files still missing after attempt ${attempt}`)
    if (attempt < retryRounds) {
      remaining = await refreshMissingJobUrls(remaining)
      await sleep(1500 * attempt)
    }
  }

  for (const job of remaining) {
    await params.skipLogger.write({
      candidateUrls: job.candidateUrls,
      kind: 'download',
      output: job.output,
      reason: `download failed after ${retryRounds} attempts; output file was not created`,
      url: job.url,
    })
  }

  console.warn(
    `${remaining.length} files skipped after ${retryRounds} attempts. Reason log: ${params.skipLogger.path ?? 'disabled'}`,
  )
}

const logGalleryPlans = (galleryPlans: Awaited<ReturnType<typeof buildJobsForGallery>>[]) => {
  const jobs = galleryPlans.flatMap((plan) => plan.jobs)
  const skippedExisting = galleryPlans.reduce((sum, plan) => sum + plan.skippedExisting, 0)
  const skippedNoAvif = galleryPlans.reduce((sum, plan) => sum + plan.skippedNoAvif, 0)

  for (const plan of galleryPlans) {
    const idLabel = plan.actualId === plan.readerId ? plan.readerId : `${plan.readerId}/${plan.actualId}`
    const aliasLabel = plan.aliasSkipped ? `, alias skipped ${plan.totalFiles}` : ''
    console.log(
      `${idLabel}: ${plan.jobs.length} queued, ${plan.skippedExisting} existing, ${plan.skippedNoAvif} no-avif${aliasLabel}, base=${plan.base}, dir=${plan.galleryDir}`,
    )
  }

  console.log(`total queued: ${jobs.length}, skipped existing: ${skippedExisting}, skipped no-avif: ${skippedNoAvif}`)

  return jobs
}

const handleGalleryPlans = async (params: {
  attemptTimeoutSeconds: number
  curl: CurlInfo
  dryRun: boolean
  galleryPlans: Awaited<ReturnType<typeof buildJobsForGallery>>[]
  outDir: string
  parallel: number
  protocol?: string
  retryRounds: number
  skipLogger: SkipLogger
  tempDir?: string
  transport: Transport
}) => {
  const jobs = logGalleryPlans(params.galleryPlans)
  if (!jobs.length) {
    return
  }

  if (params.dryRun) {
    for (const job of jobs.slice(0, 10)) {
      console.log(`${job.format} ${job.url} -> ${job.output}`)
    }
    if (jobs.length > 10) {
      console.log(`... ${jobs.length - 10} more`)
    }
    return
  }

  if (!params.tempDir) {
    throw new Error('Temporary directory is required for downloads')
  }

  await mkdir(params.outDir, { recursive: true })
  try {
    await downloadWithRetries({
      attemptTimeoutSeconds: params.attemptTimeoutSeconds,
      curl: params.curl,
      initialProtocol: params.protocol,
      jobs,
      outDir: params.outDir,
      parallel: params.parallel,
      retryRounds: params.retryRounds,
      skipLogger: params.skipLogger,
      tempDir: params.tempDir,
      transport: params.transport,
    })
  } catch (error) {
    const reason = errorReason(error)
    console.warn(`download batch skipped: ${reason}`)
    for (const job of jobs) {
      if (!(await fileExists(job.output))) {
        await params.skipLogger.write({
          candidateUrls: job.candidateUrls,
          kind: 'download',
          output: job.output,
          reason,
          url: job.url,
        })
      }
    }
  }
  console.log('download complete')
}

const isDefined = <T>(value: T | undefined): value is T => value !== undefined

const processReaderIds = async (params: {
  curl: CurlInfo
  gg: GgInfo
  options: Options
  outDir: string
  protocol?: string
  readerIds: string[]
  skipLogger: SkipLogger
  tempDir?: string
}) => {
  const galleryPlans = (
    await mapLimit(params.readerIds, params.options.metadataParallel, async (readerId) => {
      try {
        return await buildJobsForGallery({
          allowWebpFallback: params.options.allowWebpFallback,
          dryRun: params.options.dryRun,
          gg: params.gg,
          limit: params.options.limit,
          outDir: params.outDir,
          overwrite: params.options.overwrite,
          readerId,
          skipLogger: params.skipLogger,
        })
      } catch (error) {
        const reason = errorReason(error)
        console.warn(`${readerId}: skipped, ${reason}`)
        await params.skipLogger.write({
          kind: 'gallery',
          readerId,
          reason,
        })
        return undefined
      }
    })
  ).filter(isDefined)

  await handleGalleryPlans({
    attemptTimeoutSeconds: params.options.attemptTimeoutSeconds,
    curl: params.curl,
    dryRun: params.options.dryRun,
    galleryPlans,
    outDir: params.outDir,
    parallel: params.options.parallel,
    protocol: params.protocol,
    retryRounds: params.options.retryRounds,
    skipLogger: params.skipLogger,
    tempDir: params.tempDir,
    transport: params.options.transport,
  })
}

const rangeLength = (range: RangeSpec) => range.end - range.start + 1

const processRange = async (params: {
  curl: CurlInfo
  getGg: () => Promise<GgInfo>
  options: Options
  outDir: string
  protocol?: string
  range: RangeSpec
  skipLogger: SkipLogger
  tempDir?: string
}) => {
  const total = rangeLength(params.range)
  let errored = 0
  let found = 0
  let missing = 0
  let processed = 0

  console.log(`range ${params.range.start}:${params.range.end}: ${total} ids, sequential metadata`)

  for (let id = params.range.start; id <= params.range.end; id++) {
    processed++
    try {
      const galleryPlan = await buildJobsForGallery({
        allowWebpFallback: params.options.allowWebpFallback,
        dryRun: params.options.dryRun,
        gg: await params.getGg(),
        limit: params.options.limit,
        outDir: params.outDir,
        overwrite: params.options.overwrite,
        readerId: String(id),
        skipLogger: params.skipLogger,
      })
      found++
      await handleGalleryPlans({
        attemptTimeoutSeconds: params.options.attemptTimeoutSeconds,
        curl: params.curl,
        dryRun: params.options.dryRun,
        galleryPlans: [galleryPlan],
        outDir: params.outDir,
        parallel: params.options.parallel,
        protocol: params.protocol,
        retryRounds: params.options.retryRounds,
        skipLogger: params.skipLogger,
        tempDir: params.tempDir,
        transport: params.options.transport,
      })
    } catch (error) {
      if (isFetchTextError(error) && error.status === 404) {
        missing++
        await params.skipLogger.write({
          kind: 'gallery',
          readerId: String(id),
          reason: 'metadata not found (404)',
          url: error.url,
        })
      } else {
        errored++
        const reason = errorReason(error)
        console.warn(`${id}: skipped, ${reason}`)
        await params.skipLogger.write({
          kind: 'gallery',
          readerId: String(id),
          reason,
        })
      }
    }

    if (processed % 1000 === 0 || processed === total) {
      console.log(`range progress ${processed}/${total}: found=${found}, missing=${missing}, errors=${errored}`)
    }
  }

  console.log(
    `range ${params.range.start}:${params.range.end} complete: found=${found}, missing=${missing}, errors=${errored}`,
  )
}

const main = async () => {
  const options = parseArgs(Bun.argv.slice(2))
  options.targets.push(...(await readInputTargets(options.inputFiles)))
  options.targets = [...new Set(options.targets.map((target) => target.trim()).filter(Boolean))]

  if (!options.targets.length && !options.ranges.length) {
    usage()
    throw new Error('No reader URLs, ids, or ranges were provided')
  }

  const outDir = resolve(options.outDir)
  const readerIds = options.targets.map(readerIdFromTarget)
  let gg = parseGgInfo(await fetchText(`${galleryHost}/gg.js`))
  let ggFetchedAt = Date.now()
  const curl = detectCurl(options.curlPath)
  const protocol = transportOption(curl, options.transport)
  const skipLogger = await createSkipLogger(outDir, !options.dryRun)
  const totalRangeIds = options.ranges.reduce((sum, range) => sum + rangeLength(range), 0)

  console.log(`curl: ${curl.path}`)
  console.log(curl.version.split('\n').slice(0, 3).join('\n'))
  console.log(`transport: ${protocol ?? 'curl default'}`)
  console.log(
    `metadata: ${readerIds.length} explicit galleries, ${totalRangeIds} range ids, explicit parallel=${options.metadataParallel}, range sequential`,
  )
  if (skipLogger.path) {
    console.log(`skip log: ${skipLogger.path}`)
  }

  const getGg = async () => {
    if (Date.now() - ggFetchedAt > 30 * 60 * 1000) {
      gg = parseGgInfo(await fetchText(`${galleryHost}/gg.js`))
      ggFetchedAt = Date.now()
      console.log(`refreshed gg.js: base=${gg.b}`)
    }
    return gg
  }

  const tempDir = options.dryRun ? undefined : await mkdtemp(join(tmpdir(), 'hitomi-avif-'))

  try {
    if (readerIds.length) {
      await processReaderIds({
        curl,
        gg: await getGg(),
        options,
        outDir,
        protocol,
        readerIds,
        skipLogger,
        tempDir,
      })
    }

    for (const range of options.ranges) {
      await processRange({
        curl,
        getGg,
        options,
        outDir,
        protocol,
        range,
        skipLogger,
        tempDir,
      })
    }
  } finally {
    if (tempDir) {
      await rm(tempDir, {
        force: true,
        recursive: true,
      })
    }
    if (skipLogger.path && skipLogger.count > 0) {
      console.log(`skipped entries: ${skipLogger.count}. See ${skipLogger.path}`)
    }
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
