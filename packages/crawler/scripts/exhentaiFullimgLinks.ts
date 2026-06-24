#!/usr/bin/env bun

import { appendFileSync, mkdirSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, rmdir, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, resolve } from 'node:path'
import { parse } from 'node-html-parser'
import sharp from 'sharp'

type Args = {
  apiUrl: string
  avifEffort: number
  avifQuality: number
  cookieFile?: string
  debugDir?: string
  convertConcurrency: number
  delayMs: number
  downloadAvif: boolean
  downloadConcurrency: number
  downloadDir?: string
  endPage?: number
  format: OutputFormat
  gallery?: string
  gid?: number
  help: boolean
  galleryFailureThreshold: number
  indexUrl?: string
  keepOriginal: boolean
  limit?: number
  logDir: string | null
  maxGalleries?: number
  mode: Mode
  out?: string
  overwrite: boolean
  startPage: number
  timeoutMs: number
  token?: string
  verbose: boolean
}

type DownloadPipeline = {
  close: () => Promise<void>
  cleanupGallery: (target: ResolvedTarget) => Promise<void>
  enqueueEntry: (params: {
    entry: OutputEntry
    indexUrl?: string
    progress: ProgressContext
    target: ResolvedTarget
    waitForDownload?: boolean
  }) => Promise<boolean>
  isGalleryDisabled: (gid: number) => boolean
  shouldWaitForInitialProbe: (gid: number) => boolean
}

type DownloadTask = {
  avifPath: string
  entry: OutputEntry
  gid: number
  originalPath: string
  progress: ProgressContext
  resolveDownload: (success: boolean) => void
  sourceUrl: string
}

type GalleryDownloadState = {
  disabled: boolean
  failedProbeCount: number
  probeCount: number
}

type GalleryImagePage = {
  imgkey: string
  page: number
  url: string
}

type GalleryMeta = {
  filecount: number
  title?: string
  titleJpn?: string
}

type GalleryTarget = ResolvedTarget & {
  title?: string
  url: string
}

type GDataResponse = {
  gmetadata?: Array<{
    error?: string
    filecount?: number | string
    gid?: number | string
    title?: string
    title_jpn?: string
  }>
}

type Mode = 'direct' | 'showpage'

type OutputEntry = {
  page: number
  imgkey: string
  pageUrl: string
  fullimgUrl: string | null
  imageUrl: string | null
  originalPath: string | null
  originalBytes: number | null
  avifPath: string | null
  avifBytes: number | null
  error: string | null
  showkey: string | null
}

type OutputFormat = 'json' | 'jsonl' | 'text'

type ProgressContext = {
  gid?: number
  imagePage?: number
  imageTotal?: number
  indexUrl?: string
}

type ProgressCounter = {
  completedLogged: boolean
  done: number
  error: number
  ok: number
}

type ResolvedTarget = {
  gid: number
  token: string
}

type ShowPageResponse = {
  i3?: string
  i7?: string
  error?: string
  [key: string]: unknown
}

class AsyncQueue<T> {
  private closed = false
  private readonly items: T[] = []
  private readonly waiters: Array<(value: T | undefined) => void> = []

  close() {
    this.closed = true
    while (this.waiters.length > 0) {
      this.waiters.shift()?.(undefined)
    }
  }

  push(item: T) {
    if (this.closed) {
      throw new Error('Queue is closed')
    }

    const waiter = this.waiters.shift()
    if (waiter) {
      waiter(item)
      return
    }

    this.items.push(item)
  }

  shift() {
    const item = this.items.shift()
    if (item) {
      return Promise.resolve(item)
    }

    if (this.closed) {
      return Promise.resolve(undefined)
    }

    return new Promise<T | undefined>((resolve) => {
      this.waiters.push(resolve)
    })
  }
}

const baseUrl = 'https://exhentai.org'
const defaultApiUrl = 'https://s.exhentai.org/api.php'
const defaultDelayMs = 100
const defaultTimeoutMs = 10_000
const ignorableEmptyDirFiles = new Set(['.DS_Store', '.localized'])
const progressCounters = new Map<string, ProgressCounter>()
const userAgent =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0 Safari/537.36'

let progressLineOpen = false

const usage = `
ExHentai fullimg 링크 추출 스크립트

Usage:
  EXHENTAI_COOKIE='ipb_member_id=...; ipb_pass_hash=...; igneous=...' \\
    bun --filter=@litomi/crawler exhentai:fullimg -- --gallery https://exhentai.org/g/3914616/dd5473ed25/ --end-page 10

  bun --filter=@litomi/crawler exhentai:fullimg -- --gid 3914616 --token dd5473ed25 --start-page 1 --limit 5 --format json

Options:
  --gallery <url>       /g/{gid}/{gallery_token}/ 형태의 갤러리 URL
  --index-url <url>     목록 URL에서 갤러리를 순차 처리. prev/next 방향을 입력 URL 기준으로 유지
  --max-galleries <n>   목록 모드에서 처리할 갤러리 수. 없으면 다음 목록이 있는 동안 계속
  --gallery-failure-threshold <n> 첫 n개 이미지가 모두 실패/누락이면 해당 갤러리 다운로드 중단. Default: 3
  --gid <number>        갤러리 ID
  --token <token>       갤러리 토큰
  --start-page <n>      시작 이미지 번호. Default: 1
  --end-page <n>        마지막 이미지 번호. 없으면 갤러리 filecount까지
  --limit <n>           최대 처리 이미지 수
  --mode <mode>         showpage 또는 direct. Default: showpage
  --format <format>     text, jsonl, json. Default: text
  --out <file>          결과를 파일로 저장. 없으면 stdout
  --log-dir <dir>       완료/오류 로그 폴더. Default: downloads/exhentai/logs
  --no-log-files        completed.log/errors.log 파일 기록 비활성화
  --links-only          다운로드/변환 없이 fullimg 링크를 출력. 없으면 img 링크 출력
  --download-avif       fullimg 원본을 내려받고 AVIF로 변환. 기본값이라 생략 가능
  --download-dir <dir>  다운로드 폴더. Default: downloads/exhentai/{gid}
  --keep-original       AVIF 변환 후 원본 파일 유지
  --no-keep-original    AVIF 변환 후 원본 파일 삭제. 기본값이라 생략 가능
  --overwrite           기존 원본/AVIF 파일을 덮어쓰기
  --avif-quality <1-100> AVIF quality. Default: 85
  --avif-effort <1-9>   AVIF 인코딩 effort. Default: 4
  --download-concurrency <n> 원본 다운로드 동시성. Default: 2
  --convert-concurrency <n>  AVIF 변환 동시성. Default: 1
  --cookie-file <file>  EXHENTAI_COOKIE 대신 쿠키 문자열을 읽을 파일
  --debug-dir <dir>     showpage 원본 JSON을 페이지별로 저장
  --delay-ms <n>        요청 사이 대기 시간. Default: ${defaultDelayMs}
  --timeout-ms <n>      요청 timeout. Default: ${defaultTimeoutMs}
  --api-url <url>       showpage API URL. Default: ${defaultApiUrl}
  --verbose             진행 로그 출력
  --help                도움말

Notes:
  - 쿠키는 코드에 저장하지 않습니다. EXHENTAI_COOKIE나 --cookie-file로만 전달하세요.
  - gid만으로는 fullimg 링크를 만들 수 없고 gallery_token이 필요합니다.
  - 기본 동작은 fullimg 다운로드 후 AVIF 변환입니다. fullimg가 없으면 img 주소를 사용합니다.
  - --verbose가 없으면 갤러리 시작 줄을 남기고, 이미지 완료 상태는 한 줄로 갱신합니다.
  - fullimg 요청 자체는 이미지 제한/포인트를 소모할 수 있습니다.
`.trim()

await main()

function appendPersistentLog(args: Args, name: 'completed.log' | 'errors.log', line: string) {
  if (!args.logDir) {
    return
  }

  const logPath = resolve(process.cwd(), args.logDir, name)
  mkdirSync(dirname(logPath), { recursive: true })
  appendFileSync(logPath, `${line}\n`)
}

function appendProgressEventLog(args: Args, progress: ProgressContext, line: string, status: 'error' | 'ok') {
  if (status === 'error') {
    appendPersistentLog(args, 'errors.log', line)
  }

  if (typeof progress.imagePage !== 'number') {
    return
  }

  const total = progress.imageTotal
  if (typeof total !== 'number') {
    return
  }

  const counter = getProgressCounter(progress)
  if (!counter.completedLogged && counter.done >= total && counter.error === 0) {
    counter.completedLogged = true
    appendPersistentLog(args, 'completed.log', formatProgressPrefix(progress))
  }
}

async function cleanupEmptyGalleryDir(params: { args: Args; target: ResolvedTarget }) {
  const { args, target } = params
  const downloadDir = resolve(process.cwd(), getDownloadDir(args, target))

  if (await removeDirIfEffectivelyEmpty(downloadDir)) {
    log(args, `[${target.gid}] 빈 gid 폴더를 삭제했습니다 (${downloadDir})`)
  }
}

async function collectGalleryEntries(params: {
  args: Args
  cookie: string
  pipeline?: DownloadPipeline
  progress?: ProgressContext
  target: ResolvedTarget
}) {
  const { args, cookie, pipeline, target } = params
  const progress = { ...params.progress, gid: target.gid }
  showGalleryProgress(args, progress)

  const meta = await fetchGalleryMeta({ args, cookie, target })
  const endPage = Math.min(args.endPage ?? meta.filecount, meta.filecount)

  if (args.startPage > endPage) {
    throw new Error(`--start-page(${args.startPage})가 마지막 페이지(${endPage})보다 커요`)
  }

  log(args, `gallery: ${target.gid}, filecount: ${meta.filecount}${meta.title ? `, title: ${meta.title}` : ''}`)
  log(args, `mode: ${args.mode}, range: ${args.startPage}-${endPage}`)
  const entryProgress = { ...progress, imageTotal: getLastRequestedPage(args, endPage) }

  if (args.downloadAvif) {
    log(
      args,
      `download: ${describeAvifMode(args)}, dir: ${getDownloadDir(args, target)}, keep original: ${args.keepOriginal}, download concurrency: ${args.downloadConcurrency}, convert concurrency: ${args.convertConcurrency}`,
    )
  }

  const pageLinks = await collectGalleryImagePages({
    args,
    cookie,
    endPage: args.mode === 'showpage' ? args.startPage : endPage,
    startPage: args.startPage,
    target,
  })

  return args.mode === 'showpage'
    ? collectViaShowpage({ args, cookie, endPage, pageLinks, pipeline, progress: entryProgress, target })
    : collectViaDirectPages({ args, cookie, endPage, pageLinks, pipeline, progress: entryProgress, target })
}

async function collectGalleryImagePages(params: {
  args: Args
  cookie: string
  endPage: number
  startPage: number
  target: ResolvedTarget
}) {
  const { args, cookie, endPage, startPage, target } = params
  const byPage = new Map<number, GalleryImagePage>()
  let galleryPage = 0

  while (!hasAllPages(byPage, startPage, endPage, args.limit)) {
    const url = `${galleryUrl(target)}?p=${galleryPage}`
    const html = await fetchText({ args, cookie, referer: galleryUrl(target), url })
    const links = extractImagePageLinks({ gid: target.gid, html })
    let added = 0

    for (const link of links) {
      if (link.page < startPage || link.page > endPage) continue
      if (!byPage.has(link.page)) {
        byPage.set(link.page, link)
        added += 1
      }
    }

    log(args, `gallery page ${galleryPage}: found ${links.length}, added ${added}`)

    if (links.length === 0) {
      break
    }

    galleryPage += 1

    if (galleryPage > endPage) {
      break
    }

    await sleep(args.delayMs)
  }

  const missingStart = !byPage.has(startPage)
  if (missingStart) {
    throw new Error(`${startPage}페이지의 /s/{imgkey}/${target.gid}-${startPage} 링크를 갤러리에서 찾지 못했어요`)
  }

  return byPage
}

async function collectSingleGallery(params: { args: Args; cookie: string; target: ResolvedTarget }) {
  const { args, cookie, target } = params
  const pipeline = args.downloadAvif ? createDownloadConvertPipeline({ args, cookie }) : undefined

  try {
    return await collectGalleryEntries({ args, cookie, pipeline, progress: { gid: target.gid }, target })
  } finally {
    await pipeline?.close()
  }
}

function collectStrings(value: unknown): string[] {
  if (typeof value === 'string') return [value]
  if (!value || typeof value !== 'object') return []
  if (Array.isArray(value)) return value.flatMap((item) => collectStrings(item))

  return Object.values(value).flatMap((item) => collectStrings(item))
}

async function collectViaDirectPages(params: {
  args: Args
  cookie: string
  endPage: number
  pageLinks: Map<number, GalleryImagePage>
  pipeline?: DownloadPipeline
  progress: ProgressContext
  target: ResolvedTarget
}): Promise<OutputEntry[]> {
  const { args, cookie, endPage, pageLinks, pipeline, progress, target } = params
  const entries: OutputEntry[] = []

  for (let page = args.startPage; page <= endPage && !isLimitReached(args, entries); page += 1) {
    const link = pageLinks.get(page)
    if (!link) {
      log(args, `page ${page}: /s 링크가 없어서 건너뜁니다`)
      continue
    }

    const pageProgress = { ...progress, imagePage: page }
    const html = await fetchText({ args, cookie, referer: galleryUrl(target), url: link.url })
    const fullimgUrl = extractFullimgUrl(html)
    const imageUrl = extractImageUrl(html)

    const entry: OutputEntry = {
      avifBytes: null,
      avifPath: null,
      error: null,
      fullimgUrl,
      imageUrl,
      imgkey: link.imgkey,
      originalBytes: null,
      originalPath: null,
      page,
      pageUrl: link.url,
      showkey: extractShowkey(html),
    }

    entries.push(entry)

    log(args, `page ${page}: ${fullimgUrl ? 'fullimg ok' : 'fullimg missing'}`)
    if (!(await enqueueCollectedEntry({ args, entry, pipeline, progress: pageProgress, target }))) {
      break
    }

    await sleep(args.delayMs)
  }

  return entries
}

async function collectViaShowpage(params: {
  args: Args
  cookie: string
  endPage: number
  pageLinks: Map<number, GalleryImagePage>
  pipeline?: DownloadPipeline
  progress: ProgressContext
  target: ResolvedTarget
}): Promise<OutputEntry[]> {
  const { args, cookie, endPage, pageLinks, pipeline, progress, target } = params
  const entries: OutputEntry[] = []
  let current = pageLinks.get(args.startPage)

  if (!current) {
    throw new Error(`${args.startPage}페이지 시작 링크가 없어요`)
  }

  const firstHtml = await fetchText({ args, cookie, referer: galleryUrl(target), url: current.url })
  const showkey = extractShowkey(firstHtml)

  if (!showkey) {
    throw new Error(`${current.url}에서 showkey를 찾지 못했어요`)
  }

  while (current && current.page <= endPage && !isLimitReached(args, entries)) {
    const pageProgress = { ...progress, imagePage: current.page }
    const response: ShowPageResponse = await fetchJson<ShowPageResponse>({
      args,
      body: {
        gid: target.gid,
        imgkey: current.imgkey,
        method: 'showpage',
        page: current.page,
        showkey,
      },
      cookie,
      referer: baseUrl,
      url: args.apiUrl,
    })

    if (response.error) {
      throw new Error(`showpage ${current.page} 오류: ${response.error}`)
    }

    await writeDebugResponse(args, current.page, response)

    const i3: string = response.i3 ?? ''
    const i7: string = response.i7 ?? ''
    const fullimgUrl = extractFullimgUrlFromUnknown(response)
    const imageUrl = extractImageUrl(i3) ?? extractImageUrlFromUnknown(response)

    const entry: OutputEntry = {
      avifBytes: null,
      avifPath: null,
      error: null,
      fullimgUrl,
      imageUrl,
      imgkey: current.imgkey,
      originalBytes: null,
      originalPath: null,
      page: current.page,
      pageUrl: current.url,
      showkey,
    }

    entries.push(entry)

    log(
      args,
      `page ${current.page}: ${fullimgUrl ? 'fullimg ok' : 'fullimg missing'} (${Object.keys(response).join(', ')})`,
    )

    if (!(await enqueueCollectedEntry({ args, entry, pipeline, progress: pageProgress, target }))) {
      break
    }

    if (current.page >= endPage || isLimitReached(args, entries)) {
      break
    }

    const next: GalleryImagePage | undefined =
      extractNextImagePage({ currentPage: current.page, gid: target.gid, html: i3 }) ?? pageLinks.get(current.page + 1)
    current = next

    if (!current) {
      log(args, `page ${entries.at(-1)?.page}: 다음 /s 링크를 찾지 못해서 중단합니다`)
      break
    }

    await sleep(args.delayMs)
  }

  return entries
}

async function convertDownloadedImage(params: { args: Args; task: DownloadTask; workerIndex: number }) {
  const { args, task, workerIndex } = params
  const { avifPath, entry, originalPath } = task
  const originalBytes = await fileSize(originalPath)

  log(args, `page ${entry.page}: convert start (worker ${workerIndex + 1})`)
  const avifInfo = await sharp(originalPath).avif(getAvifOptions(args)).toFile(avifPath)
  const avifBytes = avifInfo.size

  if (!args.keepOriginal) {
    await rm(originalPath, { force: true })
    entry.originalPath = null
    entry.originalBytes = originalBytes
  } else {
    entry.originalPath = originalPath
    entry.originalBytes = originalBytes
  }

  entry.avifPath = avifPath
  entry.avifBytes = avifBytes
  log(args, `page ${entry.page}: saved ${avifPath} (${formatBytes(originalBytes)} -> ${formatBytes(avifBytes)})`)
  showProgressResult(args, task.progress, 'ok')
}

async function crawlIndexGalleries(params: { args: Args; cookie: string }) {
  const { args, cookie } = params
  if (!args.indexUrl) {
    throw new Error('--index-url이 필요해요')
  }

  const entries: OutputEntry[] = []
  const pipeline = args.downloadAvif ? createDownloadConvertPipeline({ args, cookie }) : undefined
  const seen = new Set<string>()
  let currentUrl: string | null = normalizeUrl(args.indexUrl)
  let processed = 0

  try {
    while (currentUrl && !isMaxGalleryReached(args, processed)) {
      log(args, `index: ${currentUrl}`)
      const html = await fetchText({ args, cookie, referer: baseUrl, url: currentUrl })
      const galleries = extractGalleryLinks(html).filter((gallery) => {
        const key = `${gallery.gid}/${gallery.token}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      log(args, `index galleries: ${galleries.length}`)
      if (galleries.length === 0) {
        throw new Error(`목록에서 갤러리 링크를 찾지 못했어요: ${currentUrl}`)
      }

      for (const gallery of galleries) {
        if (isMaxGalleryReached(args, processed)) break

        processed += 1
        const progress = { gid: gallery.gid, indexUrl: currentUrl }
        log(
          args,
          `crawl gallery ${formatGalleryProgress(args, processed)}: ${gallery.gid}${gallery.title ? ` ${gallery.title}` : ''}`,
        )

        let galleryEntries: OutputEntry[]
        try {
          galleryEntries = await collectGalleryEntries({ args, cookie, pipeline, progress, target: gallery })
        } catch (error) {
          log(args, `crawl gallery failed ${gallery.gid}: ${formatErrorForLog(error)}`)
          showProgressResult(args, progress, 'error', formatErrorOneLine(error))
          await sleep(args.delayMs)
          continue
        }

        entries.push(...galleryEntries)

        await sleep(args.delayMs)
      }

      if (isMaxGalleryReached(args, processed)) {
        break
      }

      currentUrl = extractNextIndexUrl({ currentUrl, html })
      if (!currentUrl) {
        log(args, 'index: 다음 목록 링크가 없어서 목록 순회를 중단합니다')
        break
      }
      await sleep(args.delayMs)
    }
  } finally {
    await pipeline?.close()
  }

  return entries
}

function createDownloadConvertPipeline(params: { args: Args; cookie: string }): DownloadPipeline {
  const { args, cookie } = params
  const downloadQueue = new AsyncQueue<DownloadTask>()
  const convertQueue = new AsyncQueue<DownloadTask>()
  const galleryStates = new Map<number, GalleryDownloadState>()
  const galleryTargets = new Map<number, ResolvedTarget>()
  let closed = false

  const downloadWorkers = Array.from({ length: args.downloadConcurrency }, async (_, workerIndex) => {
    while (true) {
      const task = await downloadQueue.shift()
      if (!task) {
        return
      }

      const { entry, originalPath } = task
      const state = galleryStates.get(task.gid)
      if (state?.disabled) {
        entry.error = `gallery skipped after ${args.galleryFailureThreshold} initial failures`
        log(args, `[${task.gid}] page ${entry.page}: ${entry.error}`)
        task.resolveDownload(false)
        continue
      }

      try {
        if (args.overwrite || !(await fileExists(originalPath))) {
          log(args, `page ${entry.page}: download start (worker ${workerIndex + 1})`)
          await downloadImage({
            args,
            cookie,
            outputPath: originalPath,
            referer: entry.pageUrl,
            url: task.sourceUrl,
          })
        } else {
          log(args, `page ${entry.page}: 기존 원본을 사용합니다 (${originalPath})`)
        }

        convertQueue.push(task)
        recordGalleryProbe({ args, state, success: true, task })
        task.resolveDownload(true)
      } catch (error) {
        entry.error = formatErrorForLog(error)
        log(args, `page ${entry.page}: download failed: ${entry.error}`)
        showProgressResult(args, task.progress, 'error', `download failed: ${formatErrorOneLine(error)}`)
        await rm(originalPath, { force: true })
        recordGalleryProbe({ args, state, success: false, task })
        task.resolveDownload(false)
      } finally {
        await sleep(args.delayMs)
      }
    }
  })

  const convertWorkers = Array.from({ length: args.convertConcurrency }, async (_, workerIndex) => {
    while (true) {
      const task = await convertQueue.shift()
      if (!task) {
        return
      }

      try {
        await convertDownloadedImage({ args, task, workerIndex })
      } catch (error) {
        task.entry.error = formatErrorForLog(error)
        log(args, `page ${task.entry.page}: convert failed: ${task.entry.error}`)
        showProgressResult(args, task.progress, 'error', `convert failed: ${formatErrorOneLine(error)}`)
      }
    }
  })

  return {
    close: async () => {
      if (closed) {
        return
      }

      closed = true
      downloadQueue.close()
      await Promise.all([
        Promise.all(downloadWorkers).finally(() => {
          convertQueue.close()
        }),
        Promise.all(convertWorkers),
      ])

      for (const target of galleryTargets.values()) {
        await cleanupEmptyGalleryDir({ args, target })
      }
    },
    cleanupGallery: async (target: ResolvedTarget) => {
      await cleanupEmptyGalleryDir({ args, target })
    },
    enqueueEntry: async (params: {
      entry: OutputEntry
      indexUrl?: string
      progress: ProgressContext
      target: ResolvedTarget
      waitForDownload?: boolean
    }) => {
      const { entry, indexUrl, target, waitForDownload = false } = params
      const downloadDir = getDownloadDir(args, target)
      const originalDir = resolve(process.cwd(), downloadDir, '.original')
      const progress: ProgressContext = { ...params.progress, gid: target.gid, ...(indexUrl ? { indexUrl } : {}) }
      const state = getGalleryDownloadState(galleryStates, target.gid)
      galleryTargets.set(target.gid, target)

      if (state.disabled) {
        entry.error = `gallery skipped after ${args.galleryFailureThreshold} initial failures`
        log(args, `[${target.gid}] page ${entry.page}: ${entry.error}`)
        showProgressResult(args, progress, 'error', entry.error)
        return false
      }

      const sourceUrl = getDownloadSourceUrl(entry)
      if (!sourceUrl) {
        entry.error = 'download image link missing'
        log(args, `[${target.gid}] page ${entry.page}: fullimg/img 링크가 없어서 다운로드를 건너뜁니다`)
        showProgressResult(args, progress, 'error', 'fullimg/img link missing')
        recordGalleryProbe({
          args,
          state,
          success: false,
          task: { entry, gid: target.gid },
        })
        return false
      }

      await mkdir(downloadDir, { recursive: true })
      await mkdir(originalDir, { recursive: true })

      if (!entry.fullimgUrl) {
        log(args, `[${target.gid}] page ${entry.page}: fullimg 링크가 없어 img 주소로 다운로드합니다`)
      }

      const originalExt = getImageExtension(sourceUrl)
      const originalPath = `${originalDir}/${entry.page}${originalExt}`
      const avifPath = `${downloadDir}/${entry.page}.avif`

      if (!args.overwrite && (await fileExists(avifPath))) {
        entry.originalPath = (await fileExists(originalPath)) ? originalPath : null
        entry.originalBytes = entry.originalPath ? await fileSize(entry.originalPath) : null
        entry.avifPath = avifPath
        entry.avifBytes = await fileSize(avifPath)
        log(args, `[${target.gid}] page ${entry.page}: 기존 AVIF가 있어서 건너뜁니다 (${avifPath})`)
        showProgressResult(args, progress, 'ok')
        recordGalleryProbe({ args, state, success: true, task: { entry, gid: target.gid } })
        return true
      }

      let resolveDownload: (success: boolean) => void = () => {}
      const downloadDone = new Promise<boolean>((resolve) => {
        resolveDownload = resolve
      })

      downloadQueue.push({ avifPath, entry, gid: target.gid, originalPath, progress, resolveDownload, sourceUrl })
      return waitForDownload ? await downloadDone : true
    },
    isGalleryDisabled: (gid: number) => {
      return galleryStates.get(gid)?.disabled ?? false
    },
    shouldWaitForInitialProbe: (gid: number) => {
      const state = getGalleryDownloadState(galleryStates, gid)
      return !state.disabled && state.probeCount < args.galleryFailureThreshold
    },
  }
}

function describeAvifMode(args: Args) {
  return `avif q=${args.avifQuality}, effort=${args.avifEffort}`
}

async function downloadImage(params: { args: Args; cookie: string; outputPath: string; referer: string; url: string }) {
  const { args, cookie, outputPath, referer, url } = params
  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        ...requestHeaders({ cookie, referer }),
        accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      method: 'GET',
      redirect: 'follow',
    },
    args.timeoutMs,
  )

  if (!response.ok) {
    throw new Error(
      `원본 다운로드 실패: ${url} (${response.status} ${response.statusText})\n${await safeErrorBody(response)}`,
    )
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (contentType && !contentType.startsWith('image/')) {
    throw new Error(`원본 다운로드 응답이 이미지가 아니에요: ${url} (${contentType})\n${await safeErrorBody(response)}`)
  }

  const bytes = new Uint8Array(await response.arrayBuffer())
  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, bytes)
}

async function enqueueCollectedEntry(params: {
  args: Args
  entry: OutputEntry
  pipeline?: DownloadPipeline
  progress: ProgressContext
  target: ResolvedTarget
}) {
  const { args, entry, pipeline, progress, target } = params
  if (!pipeline) {
    showProgressResult(
      args,
      progress,
      getDownloadSourceUrl(entry) ? 'ok' : 'error',
      getDownloadSourceUrl(entry) ? undefined : 'fullimg/img link missing',
    )
    return true
  }

  const waitForDownload = pipeline.shouldWaitForInitialProbe(target.gid)
  await pipeline.enqueueEntry({
    entry,
    ...(progress.indexUrl ? { indexUrl: progress.indexUrl } : {}),
    progress,
    target,
    waitForDownload,
  })

  if (pipeline.isGalleryDisabled(target.gid)) {
    log(
      args,
      `[${target.gid}] 첫 ${args.galleryFailureThreshold}개 이미지 확인 결과 모두 실패해서 남은 이미지 주소 조회를 중단합니다`,
    )
    await pipeline.cleanupGallery(target)
    return false
  }

  return true
}

function extractFullimgUrl(html: string) {
  const root = parse(html)

  for (const anchor of root.querySelectorAll('a[href]')) {
    const href = anchor.getAttribute('href')
    if (!href) continue
    if (href.includes('/fullimg/') || href.includes('fullimg.php')) {
      return normalizeUrl(href)
    }
  }

  const regexMatch = /href=["']([^"']*(?:\/fullimg\/|fullimg\.php)[^"']*)["']/i.exec(html)
  return regexMatch ? normalizeUrl(regexMatch[1].replaceAll('&amp;', '&')) : null
}

function extractFullimgUrlFromUnknown(value: unknown): string | null {
  for (const text of collectStrings(value)) {
    const fromHtml = extractFullimgUrl(text)
    if (fromHtml) return fromHtml

    const rawMatch = /https?:\/\/[^\s"'<>]+(?:\/fullimg\/|fullimg\.php)[^\s"'<>]*/i.exec(text)
    if (rawMatch) return normalizeUrl(rawMatch[0].replaceAll('&amp;', '&'))

    const pathMatch = /\/fullimg\/[^\s"'<>]+/i.exec(text)
    if (pathMatch) return normalizeUrl(pathMatch[0].replaceAll('&amp;', '&'))
  }

  return null
}

function extractGalleryLinks(html: string): GalleryTarget[] {
  const root = parse(html)
  const byKey = new Map<string, GalleryTarget>()

  for (const anchor of root.querySelectorAll('a[href]')) {
    const href = anchor.getAttribute('href')
    if (!href) continue

    const match = /\/g\/(\d+)\/([^/?#]+)/.exec(href)
    if (!match) continue

    const gid = Number.parseInt(match[1], 10)
    if (!Number.isSafeInteger(gid)) continue

    const token = match[2]
    const key = `${gid}/${token}`
    if (byKey.has(key)) continue

    const title = anchor.text.trim().replace(/\s+/g, ' ') || undefined
    byKey.set(key, {
      gid,
      title,
      token,
      url: normalizeUrl(href),
    })
  }

  return [...byKey.values()]
}

function extractImagePageLinks(params: { gid: number; html: string }): GalleryImagePage[] {
  const { gid, html } = params
  const root = parse(html)
  const byPage = new Map<number, GalleryImagePage>()

  for (const anchor of root.querySelectorAll('a[href]')) {
    const href = anchor.getAttribute('href')
    if (!href) continue

    const parsed = parseImagePageHref({ gid, href })
    if (parsed && !byPage.has(parsed.page)) {
      byPage.set(parsed.page, parsed)
    }
  }

  return [...byPage.values()].sort((a, b) => a.page - b.page)
}

function extractImageUrl(html: string) {
  const root = parse(html)
  const image = root.querySelector('img#img') ?? root.querySelector('img[src]')
  const src = image?.getAttribute('src')
  return src ? normalizeUrl(src.replaceAll('&amp;', '&')) : null
}

function extractImageUrlFromUnknown(value: unknown): string | null {
  for (const text of collectStrings(value)) {
    const fromHtml = extractImageUrl(text)
    if (fromHtml) return fromHtml
  }

  return null
}

function extractNextImagePage(params: { currentPage: number; gid: number; html: string }): GalleryImagePage | null {
  const links = extractImagePageLinks(params)
  return (
    links.find((link) => link.page === params.currentPage + 1) ??
    links.find((link) => link.page > params.currentPage) ??
    null
  )
}

function extractNextIndexUrl(params: { currentUrl: string; html: string }) {
  const { currentUrl, html } = params
  const current = new URL(normalizeUrl(currentUrl))
  const cursor = parseIndexCursor(current)
  if (!cursor) {
    throw new Error(`목록 URL에는 prev 또는 next 값이 필요해요: ${currentUrl}`)
  }

  const root = parse(html)
  let bestUrl: string | null = null
  let bestValue = cursor.name === 'prev' ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY

  for (const anchor of root.querySelectorAll('a[href]')) {
    const href = anchor.getAttribute('href')
    if (!href) continue

    const url = new URL(normalizeUrl(href))
    if (url.origin !== current.origin || url.pathname !== current.pathname) continue

    const candidate = parseIndexCursor(url)
    if (!candidate || candidate.name !== cursor.name) continue

    if (cursor.name === 'prev' && candidate.value > cursor.value && candidate.value < bestValue) {
      bestValue = candidate.value
      bestUrl = url.toString()
    }

    if (cursor.name === 'next' && candidate.value < cursor.value && candidate.value > bestValue) {
      bestValue = candidate.value
      bestUrl = url.toString()
    }
  }

  return bestUrl
}

function extractShowkey(html: string) {
  return /\bshowkey\s*=\s*['"]?([0-9a-z-]+)/i.exec(html)?.[1] ?? null
}

async function fetchGalleryMeta(params: { args: Args; cookie: string; target: ResolvedTarget }): Promise<GalleryMeta> {
  const { args, cookie, target } = params
  const response = await fetchJson<GDataResponse>({
    args,
    body: {
      gidlist: [[target.gid, target.token]],
      method: 'gdata',
      namespace: 1,
    },
    cookie,
    referer: galleryUrl(target),
    url: args.apiUrl,
  })
  const metadata = response.gmetadata?.[0]

  if (!metadata) {
    throw new Error('gdata 응답에 gmetadata가 없어요')
  }

  if (metadata.error) {
    throw new Error(`gdata 오류: ${metadata.error}`)
  }

  const filecount = Number(metadata.filecount)
  if (!Number.isSafeInteger(filecount) || filecount <= 0) {
    throw new Error(`filecount가 올바르지 않아요: ${metadata.filecount}`)
  }

  return {
    filecount,
    title: metadata.title,
    titleJpn: metadata.title_jpn,
  }
}

async function fetchJson<T>(params: { args: Args; body: unknown; cookie: string; referer: string; url: string }) {
  const { args, body, cookie, referer, url } = params
  const response = await fetchWithTimeout(
    url,
    {
      body: JSON.stringify(body),
      headers: {
        ...requestHeaders({ cookie, origin: baseUrl, referer }),
        accept: '*/*',
        'content-type': 'application/json',
      },
      method: 'POST',
    },
    args.timeoutMs,
  )

  if (!response.ok) {
    throw new Error(`POST ${url} 실패: ${response.status} ${response.statusText}\n${await safeErrorBody(response)}`)
  }

  const text = await response.text()

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error(`JSON 응답 파싱 실패: ${text.slice(0, 500)}`)
  }
}

async function fetchText(params: { args: Args; cookie: string; referer: string; url: string }) {
  const { args, cookie, referer, url } = params
  const response = await fetchWithTimeout(
    url,
    {
      headers: requestHeaders({ cookie, referer }),
      method: 'GET',
    },
    args.timeoutMs,
  )

  if (!response.ok) {
    throw new Error(`GET ${url} 실패: ${response.status} ${response.statusText}\n${await safeErrorBody(response)}`)
  }

  return response.text()
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timeout)
  }
}

async function fileExists(path: string) {
  try {
    await stat(path)
    return true
  } catch {
    return false
  }
}

async function fileSize(path: string) {
  return (await stat(path)).size
}

function finishProgressLine() {
  if (!progressLineOpen) {
    return
  }

  process.stderr.write('\n')
  progressLineOpen = false
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes}B`
  const mib = bytes / 1024 / 1024
  if (mib >= 1) return `${mib.toFixed(2)}MiB`
  return `${(bytes / 1024).toFixed(1)}KiB`
}

function formatErrorForLog(error: unknown) {
  return error instanceof Error ? error.message : String(error)
}

function formatErrorOneLine(error: unknown) {
  return formatErrorForLog(error).replace(/\s*\n\s*/g, ' | ')
}

function formatGalleryProgress(args: Args, processed: number) {
  return typeof args.maxGalleries === 'number' ? `${processed}/${args.maxGalleries}` : String(processed)
}

function formatImageProgress(progress: ProgressContext) {
  return typeof progress.imageTotal === 'number'
    ? `${progress.imagePage}/${progress.imageTotal}`
    : String(progress.imagePage)
}

function formatIndexProgress(indexUrl: string) {
  try {
    const url = new URL(indexUrl)
    const cursor = parseIndexCursor(url)
    return cursor ? `${cursor.name}=${cursor.value}` : `index=${indexUrl}`
  } catch {
    return `index=${indexUrl}`
  }
}

function formatProgressCounter(progress: ProgressContext, status: 'error' | 'ok', message?: string) {
  const counter = getProgressCounter(progress)
  counter.done += 1
  counter[status] += 1

  const fields = [
    formatProgressPrefix(progress),
    `images=${counter.done}/${progress.imageTotal ?? '?'}`,
    `ok=${counter.ok}`,
    `error=${counter.error}`,
    `status=${status}`,
    message ? `message=${message}` : null,
  ].filter((field): field is string => Boolean(field))

  return fields.join(' ')
}

function formatProgressPrefix(progress: ProgressContext) {
  return [
    progress.indexUrl ? formatIndexProgress(progress.indexUrl) : null,
    typeof progress.gid === 'number' ? `gallery=${progress.gid}` : null,
  ]
    .filter((field): field is string => Boolean(field))
    .join(' ')
}

function galleryUrl(target: ResolvedTarget) {
  return `${baseUrl}/g/${target.gid}/${target.token}/`
}

function getAvifOptions(args: Args): sharp.AvifOptions {
  return { effort: args.avifEffort, quality: args.avifQuality }
}

function getDownloadDir(args: Args, target?: ResolvedTarget) {
  const baseDir = args.downloadDir ?? 'downloads/exhentai'
  return target ? `${baseDir}/${target.gid}` : baseDir
}

function getDownloadSourceUrl(entry: OutputEntry) {
  return entry.fullimgUrl ?? entry.imageUrl
}

function getGalleryDownloadState(states: Map<number, GalleryDownloadState>, gid: number) {
  let state = states.get(gid)
  if (!state) {
    state = {
      disabled: false,
      failedProbeCount: 0,
      probeCount: 0,
    }
    states.set(gid, state)
  }
  return state
}

function getImageExtension(url: string) {
  const extension = extname(new URL(url).pathname).toLowerCase()
  return extension && extension.length <= 8 ? extension : '.img'
}

function getLastRequestedPage(args: Args, endPage: number) {
  return args.limit ? Math.min(endPage, args.startPage + args.limit - 1) : endPage
}

function getProgressCounter(progress: ProgressContext) {
  const key = [
    progress.indexUrl ? formatIndexProgress(progress.indexUrl) : 'index=?',
    typeof progress.gid === 'number' ? `gallery=${progress.gid}` : 'gallery=?',
  ].join('|')
  let counter = progressCounters.get(key)
  if (!counter) {
    counter = { completedLogged: false, done: 0, error: 0, ok: 0 }
    progressCounters.set(key, counter)
  }
  return counter
}

function hasAllPages(map: Map<number, GalleryImagePage>, startPage: number, endPage: number, limit?: number) {
  const neededEndPage = limit ? Math.min(endPage, startPage + limit - 1) : endPage

  for (let page = startPage; page <= neededEndPage; page += 1) {
    if (!map.has(page)) return false
  }

  return true
}

function isIgnorableEmptyDirCleanupError(error: unknown) {
  if (!(error instanceof Error) || !('code' in error)) {
    return false
  }

  return ['EEXIST', 'ENOENT', 'ENOTDIR', 'ENOTEMPTY'].includes(String(error.code))
}

function isLimitReached(args: Args, entries: OutputEntry[]) {
  return typeof args.limit === 'number' && entries.length >= args.limit
}

function isMaxGalleryReached(args: Args, processed: number) {
  return typeof args.maxGalleries === 'number' && processed >= args.maxGalleries
}

function log(args: Args, message: string) {
  if (args.verbose) {
    console.error(`[exhentai-fullimg] ${message}`)
  }
}

async function main() {
  try {
    const args = parseArgs(process.argv.slice(2))

    if (args.help) {
      console.log(usage)
      return
    }

    const cookie = await resolveCookie(args)
    const entries = args.indexUrl
      ? await crawlIndexGalleries({ args, cookie })
      : await collectSingleGallery({ args, cookie, target: resolveTarget(args) })

    await writeOutput(args, entries)
  } catch (error) {
    finishProgressLine()
    console.error(error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

function normalizeUrl(value: string) {
  const decoded = value.replaceAll('&amp;', '&')
  if (/^https?:\/\//i.test(decoded)) return decoded
  if (decoded.startsWith('//')) return `https:${decoded}`
  return new URL(decoded, `${baseUrl}/`).toString()
}

function parseArgs(argv: string[]): Args {
  const args: Args = {
    apiUrl: defaultApiUrl,
    avifEffort: 4,
    avifQuality: 85,
    convertConcurrency: 1,
    delayMs: defaultDelayMs,
    downloadAvif: true,
    downloadConcurrency: 2,
    format: 'text',
    galleryFailureThreshold: 3,
    help: false,
    keepOriginal: false,
    logDir: 'downloads/exhentai/logs',
    mode: 'showpage',
    overwrite: false,
    startPage: 1,
    timeoutMs: defaultTimeoutMs,
    verbose: false,
  }

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]

    if (arg === '--help' || arg === '-h') {
      args.help = true
    } else if (arg === '--gallery') {
      args.gallery = takeValue(argv, i, arg)
      i += 1
    } else if (arg === '--index-url') {
      args.indexUrl = takeValue(argv, i, arg)
      i += 1
    } else if (arg === '--max-galleries') {
      args.maxGalleries = parsePositiveInt(arg, takeValue(argv, i, arg))
      i += 1
    } else if (arg === '--gallery-failure-threshold') {
      args.galleryFailureThreshold = parsePositiveInt(arg, takeValue(argv, i, arg))
      i += 1
    } else if (arg === '--gid') {
      args.gid = parsePositiveInt(arg, takeValue(argv, i, arg))
      i += 1
    } else if (arg === '--token' || arg === '--gtoken') {
      args.token = takeValue(argv, i, arg)
      i += 1
    } else if (arg === '--start-page' || arg === '--start') {
      args.startPage = parsePositiveInt(arg, takeValue(argv, i, arg))
      i += 1
    } else if (arg === '--end-page' || arg === '--end') {
      args.endPage = parsePositiveInt(arg, takeValue(argv, i, arg))
      i += 1
    } else if (arg === '--limit') {
      args.limit = parsePositiveInt(arg, takeValue(argv, i, arg))
      i += 1
    } else if (arg === '--mode') {
      args.mode = parseMode(takeValue(argv, i, arg))
      i += 1
    } else if (arg === '--format') {
      args.format = parseOutputFormat(takeValue(argv, i, arg))
      i += 1
    } else if (arg === '--out') {
      args.out = takeValue(argv, i, arg)
      i += 1
    } else if (arg === '--log-dir') {
      args.logDir = takeValue(argv, i, arg)
      i += 1
    } else if (arg === '--no-log-files') {
      args.logDir = null
    } else if (arg === '--download-avif') {
      args.downloadAvif = true
    } else if (arg === '--links-only') {
      args.downloadAvif = false
    } else if (arg === '--download-dir') {
      args.downloadDir = takeValue(argv, i, arg)
      i += 1
    } else if (arg === '--keep-original') {
      args.keepOriginal = true
    } else if (arg === '--no-keep-original') {
      args.keepOriginal = false
    } else if (arg === '--overwrite') {
      args.overwrite = true
    } else if (arg === '--avif-quality') {
      args.avifQuality = parseBoundedInt(arg, takeValue(argv, i, arg), 1, 100)
      i += 1
    } else if (arg === '--avif-effort') {
      args.avifEffort = parseBoundedInt(arg, takeValue(argv, i, arg), 1, 9)
      i += 1
    } else if (arg === '--download-concurrency') {
      args.downloadConcurrency = parseBoundedInt(arg, takeValue(argv, i, arg), 1, 10)
      i += 1
    } else if (arg === '--convert-concurrency') {
      args.convertConcurrency = parseBoundedInt(arg, takeValue(argv, i, arg), 1, 8)
      i += 1
    } else if (arg === '--cookie-file') {
      args.cookieFile = takeValue(argv, i, arg)
      i += 1
    } else if (arg === '--debug-dir') {
      args.debugDir = takeValue(argv, i, arg)
      i += 1
    } else if (arg === '--delay-ms') {
      args.delayMs = parseNonNegativeInt(arg, takeValue(argv, i, arg))
      i += 1
    } else if (arg === '--timeout-ms') {
      args.timeoutMs = parsePositiveInt(arg, takeValue(argv, i, arg))
      i += 1
    } else if (arg === '--api-url') {
      args.apiUrl = takeValue(argv, i, arg)
      i += 1
    } else if (arg === '--verbose') {
      args.verbose = true
    } else if (arg.startsWith('--')) {
      throw new Error(`알 수 없는 옵션이에요: ${arg}`)
    } else if (!args.gallery && !args.gid) {
      args.gallery = arg
    } else {
      throw new Error(`알 수 없는 인자예요: ${arg}`)
    }
  }

  if (args.indexUrl && (args.gallery || args.gid || args.token)) {
    throw new Error('--index-url은 --gallery/--gid/--token과 함께 사용할 수 없어요')
  }

  return args
}

function parseBoundedInt(name: string, value: string, min: number, max: number) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max) {
    throw new Error(`${name} 값은 ${min}-${max} 사이의 정수여야 해요: ${value}`)
  }
  return parsed
}

function parseGalleryInput(value: string): ResolvedTarget {
  const trimmed = value.trim()
  const urlMatch = /\/g\/(\d+)\/([^/?#]+)/.exec(trimmed)
  const compactMatch = /^(\d+)\/([^/?#]+)$/.exec(trimmed)
  const match = urlMatch ?? compactMatch

  if (!match) {
    throw new Error(`갤러리 URL은 /g/{gid}/{token}/ 형태여야 해요: ${value}`)
  }

  return {
    gid: parsePositiveInt('gid', match[1]),
    token: match[2],
  }
}

function parseImagePageHref(params: { gid: number; href: string }): GalleryImagePage | null {
  const { gid, href } = params
  const match = new RegExp(`/s/([^/?#]+)/${gid}-(\\d+)`).exec(href)
  if (!match) return null

  return {
    imgkey: match[1],
    page: Number.parseInt(match[2], 10),
    url: normalizeUrl(href),
  }
}

function parseIndexCursor(url: URL): { name: 'next' | 'prev'; value: number } | null {
  const hasPrev = url.searchParams.has('prev')
  const prev = parseIndexCursorValue(url, 'prev')
  if (hasPrev && prev === null) {
    return null
  }

  if (prev !== null) {
    return { name: 'prev', value: prev }
  }

  const hasNext = url.searchParams.has('next')
  const next = parseIndexCursorValue(url, 'next')
  if (hasNext && next === null) {
    return null
  }

  if (next !== null) {
    return { name: 'next', value: next }
  }

  return { name: 'prev', value: 0 }
}

function parseIndexCursorValue(url: URL, name: 'next' | 'prev') {
  const raw = url.searchParams.get(name)
  if (raw === null) return null
  const parsed = Number.parseInt(raw, 10)
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null
}

function parseMode(value: string): Mode {
  if (value === 'showpage' || value === 'direct') return value
  throw new Error(`--mode는 showpage 또는 direct만 가능해요: ${value}`)
}

function parseNonNegativeInt(name: string, value: string) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`${name} 값은 0 이상의 정수여야 해요: ${value}`)
  }
  return parsed
}

function parseOutputFormat(value: string): OutputFormat {
  if (value === 'text' || value === 'jsonl' || value === 'json') return value
  throw new Error(`--format은 text, jsonl, json만 가능해요: ${value}`)
}

function parsePositiveInt(name: string, value: string) {
  const parsed = Number.parseInt(value, 10)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} 값은 양의 정수여야 해요: ${value}`)
  }
  return parsed
}

function recordGalleryProbe(params: {
  args: Args
  state?: GalleryDownloadState
  success: boolean
  task: Pick<DownloadTask, 'entry' | 'gid'>
}) {
  const { args, state, success, task } = params
  if (!state || state.disabled || state.probeCount >= args.galleryFailureThreshold) {
    return
  }

  state.probeCount += 1
  if (!success) {
    state.failedProbeCount += 1
  }

  if (state.probeCount >= args.galleryFailureThreshold && state.failedProbeCount >= args.galleryFailureThreshold) {
    state.disabled = true
    log(
      args,
      `[${task.gid}] 첫 ${args.galleryFailureThreshold}개 이미지가 모두 실패해서 이 갤러리의 나머지 다운로드를 건너뜁니다`,
    )
  }
}

async function removeDirIfEffectivelyEmpty(path: string) {
  try {
    const entries = await readdir(path, { withFileTypes: true })
    let hasContent = false

    for (const entry of entries) {
      const childPath = resolve(path, entry.name)
      if (entry.isDirectory()) {
        const removed = await removeDirIfEffectivelyEmpty(childPath)
        if (!removed) {
          hasContent = true
        }
        continue
      }

      if (ignorableEmptyDirFiles.has(entry.name)) {
        await rm(childPath, { force: true })
        continue
      }

      hasContent = true
    }

    if (hasContent) {
      return false
    }

    await rmdir(path)
    return true
  } catch (error) {
    if (isIgnorableEmptyDirCleanupError(error)) {
      return false
    }

    throw error
  }
}

function requestHeaders(params: { cookie: string; origin?: string; referer: string }): Record<string, string> {
  const { cookie, origin, referer } = params
  return {
    accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'accept-language': 'ko-KR,ko;q=0.9,en;q=0.4',
    cookie,
    ...(origin ? { origin } : {}),
    referer,
    'user-agent': userAgent,
  }
}

async function resolveCookie(args: Args) {
  const cookie = args.cookieFile
    ? await readFile(resolve(process.cwd(), args.cookieFile), 'utf-8')
    : process.env.EXHENTAI_COOKIE
  const normalized = cookie?.trim()

  if (!normalized) {
    throw new Error('인증 쿠키가 필요해요. EXHENTAI_COOKIE 환경변수 또는 --cookie-file로 전달하세요')
  }

  return normalized
}

function resolveTarget(args: Args): ResolvedTarget {
  if (args.gallery) {
    const parsed = parseGalleryInput(args.gallery)
    if (args.gid && args.gid !== parsed.gid) {
      throw new Error(`--gid(${args.gid})와 --gallery의 gid(${parsed.gid})가 달라요`)
    }
    if (args.token && args.token !== parsed.token) {
      throw new Error('--token과 --gallery의 token이 달라요')
    }
    return parsed
  }

  if (!args.gid) {
    throw new Error('--gallery 또는 --gid/--token이 필요해요')
  }

  if (!args.token) {
    throw new Error('gid만으로는 fullimg 링크를 유도할 수 없어요. --token 또는 --gallery URL을 같이 주세요')
  }

  return {
    gid: args.gid,
    token: args.token,
  }
}

async function safeErrorBody(response: Response) {
  try {
    return (await response.text()).slice(0, 500)
  } catch {
    return ''
  }
}

function showGalleryProgress(args: Args, progress: ProgressContext) {
  if (args.verbose) {
    return
  }

  writePermanentProgressLine(formatProgressPrefix(progress))
}

function showProgressResult(args: Args, progress: ProgressContext, status: 'error' | 'ok', message?: string) {
  const line =
    typeof progress.imagePage === 'number'
      ? formatProgressCounter(progress, status, message)
      : [
          progress.indexUrl ? formatIndexProgress(progress.indexUrl) : null,
          typeof progress.gid === 'number' ? `gallery=${progress.gid}` : null,
          `status=${status}`,
          message ? `message=${message}` : null,
        ]
          .filter((field): field is string => Boolean(field))
          .join(' ')

  if (!line) {
    return
  }

  appendProgressEventLog(args, progress, line, status)

  if (args.verbose) {
    return
  }

  if (typeof progress.imagePage === 'number') {
    writeProgressLine(line)
    return
  }
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function takeValue(args: string[], index: number, name: string) {
  const value = args[index + 1]
  if (!value || value.startsWith('--')) {
    throw new Error(`${name} 옵션에는 값이 필요해요`)
  }
  return value
}

async function writeDebugResponse(args: Args, page: number, response: ShowPageResponse) {
  if (!args.debugDir) {
    return
  }

  const debugDir = resolve(process.cwd(), args.debugDir)
  await mkdir(debugDir, { recursive: true })
  await writeFile(`${debugDir}/showpage-${page}.json`, `${JSON.stringify(response, null, 2)}\n`)
}

async function writeOutput(args: Args, entries: OutputEntry[]) {
  finishProgressLine()

  const body =
    args.format === 'json'
      ? `${JSON.stringify(entries, null, 2)}\n`
      : args.format === 'jsonl'
        ? `${entries.map((entry) => JSON.stringify(entry)).join('\n')}\n`
        : `${entries
            .flatMap((entry) => {
              if (args.downloadAvif)
                return entry.avifPath ? [entry.avifPath] : entry.originalPath ? [entry.originalPath] : []
              return getDownloadSourceUrl(entry) ? [getDownloadSourceUrl(entry)!] : []
            })
            .join('\n')}\n`

  if (!args.out) {
    process.stdout.write(body)
    return
  }

  const outPath = resolve(process.cwd(), args.out)
  await mkdir(dirname(outPath), { recursive: true })
  await writeFile(outPath, body)
  console.error(`saved: ${outPath}`)
}

function writePermanentProgressLine(line: string) {
  if (!line) {
    return
  }

  if (progressLineOpen) {
    process.stderr.write(`\r\x1b[2K${line}\n`)
    progressLineOpen = false
    return
  }

  console.error(line)
}

function writeProgressLine(line: string) {
  process.stderr.write(`\r\x1b[2K${line}`)
  progressLineOpen = true
}
