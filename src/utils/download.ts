import type { ZipWriterConstructorOptions } from '@zip.js/zip.js/lib/zip-core-writer.js'

import pLimit from 'p-limit'
import pThrottle from 'p-throttle'
import { toast } from 'sonner'

import { sleep } from './time'

type DownloadResult =
  | {
      blob: Blob
      image: Options['images'][number]
      ok: true
    }
  | {
      error: unknown
      image: Options['images'][number]
      ok: false
    }

type Options = {
  filename: string
  images: { filename: string; url?: string; urls?: string[] }[]
  onProgress?: (completed: number) => void
}

const MAX_DOWNLOAD_CONCURRENT_REQUESTS = 4
const MAX_DOWNLOAD_REQUESTS_PER_SECOND = 4
const DOWNLOAD_REQUEST_INTERVAL_MS = 1000
const DEFAULT_429_RETRY_DELAY_MS = 1000
const MAX_429_RETRIES = 3

const downloadConcurrencyLimit = pLimit(MAX_DOWNLOAD_CONCURRENT_REQUESTS)
const importZipWriter = () => import('@zip.js/zip.js/lib/zip-core-writer.js')

const downloadThrottle = pThrottle({
  limit: MAX_DOWNLOAD_REQUESTS_PER_SECOND,
  interval: DOWNLOAD_REQUEST_INTERVAL_MS,
  strict: true,
})

const runThrottledDownloadAttempt = downloadThrottle((url: string, signal: AbortSignal) =>
  fetch(url, { credentials: 'include', signal }),
)

type FileSystemFileHandle = {
  createWritable(): Promise<FileSystemWritableFileStream>
}

type FileSystemWritableFileStream = WritableStream & {
  abort(reason?: unknown): Promise<void>
  close(): Promise<void>
  write(data: string | Blob | BufferSource): Promise<void>
}

type SaveFilePicker = (options?: {
  excludeAcceptAllOption?: boolean
  suggestedName?: string
  types?: Array<{
    accept: Record<string, string[]>
    description?: string
  }>
}) => Promise<FileSystemFileHandle>

export class DownloadNotSupportedError extends Error {
  readonly name = 'DownloadNotSupportedError'

  constructor() {
    super('현재 브라우저는 대용량 ZIP 다운로드를 지원하지 않아요. Chrome 또는 Edge에서 다시 시도해 주세요.')
  }
}

export function downloadBlob(blob: Blob, filename: string) {
  const blobURL = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobURL
  link.download = filename
  link.click()
  URL.revokeObjectURL(blobURL)
}

export async function downloadMultipleImages({ filename, images, onProgress }: Options) {
  const saveFilePicker = getSaveFilePicker()

  const zipFileHandle = await saveFilePicker({
    suggestedName: `${sanitizeDownloadFilename(filename)}.zip`,
    types: [
      {
        description: 'ZIP archive',
        accept: { 'application/zip': ['.zip'] },
      },
    ],
  })

  const zipOptions: ZipWriterConstructorOptions = {
    level: 0,
    useWebWorkers: false,
    zip64: images.length > 100,
  }

  const writable = await zipFileHandle.createWritable()
  const abortController = new AbortController()

  let completed = 0
  let successCount = 0
  let nextDownloadIndex = 0
  let nextWriteIndex = 0
  const inFlightDownloads = new Map<number, Promise<DownloadResult>>()

  try {
    const { ZipWriter } = await importZipWriter()
    const zip = new ZipWriter(writable, zipOptions)

    startDownloads()

    while (nextWriteIndex < images.length) {
      const download = inFlightDownloads.get(nextWriteIndex)
      if (!download) {
        break
      }

      const result = await download
      inFlightDownloads.delete(nextWriteIndex)
      nextWriteIndex++

      if (!result.ok) {
        toast.error(
          `다운로드 실패: ${result.image.filename}: ${result.error instanceof Error ? result.error.message : result.error}`,
        )

        completed++
        onProgress?.(completed)
        startDownloads()
        continue
      }

      try {
        await zip.add(result.image.filename, result.blob.stream(), { signal: abortController.signal })
        successCount++
      } catch (error) {
        abortController.abort(error)
        throw new Error(`ZIP 저장 실패: ${result.image.filename}: ${error instanceof Error ? error.message : error}`)
      } finally {
        completed++
        onProgress?.(completed)
      }

      startDownloads()
    }

    if (successCount === 0) {
      throw new Error('모든 이미지를 다운로드할 수 없어요')
    }

    await zip.close()
  } catch (error) {
    abortController.abort(error)
    await writable.abort(error).catch(() => undefined)
    throw error
  }

  function startDownloads() {
    while (
      inFlightDownloads.size < MAX_DOWNLOAD_CONCURRENT_REQUESTS &&
      nextDownloadIndex < images.length &&
      !abortController.signal.aborted
    ) {
      const index = nextDownloadIndex
      const image = images[index]
      nextDownloadIndex++
      inFlightDownloads.set(
        index,
        downloadConcurrencyLimit(() => downloadImage(image, abortController.signal)),
      )
    }
  }
}

async function downloadImage(image: Options['images'][number], signal: AbortSignal): Promise<DownloadResult> {
  try {
    const response = await fetchDownloadResponse(image.urls?.length ? image.urls : (image.url ?? ''), signal)
    const blob = await response.blob()
    return { blob, image, ok: true }
  } catch (error) {
    return { error, image, ok: false }
  }
}

async function fetchDownloadResponse(imageURL: string | string[], signal: AbortSignal): Promise<Response> {
  const candidates = (Array.isArray(imageURL) ? imageURL : [imageURL]).filter(Boolean)

  let lastError: Error | undefined

  for (const candidate of candidates) {
    if (signal.aborted) {
      throw new DOMException('다운로드가 취소됐어요', 'AbortError')
    }

    try {
      const response = await fetchWith429Retry(candidate, signal)

      if (response.ok) {
        return response
      }

      lastError = new Error([response.status, response.statusText].filter(Boolean).join(' '))
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('다운로드에 실패했어요')
    }
  }

  throw lastError ?? new Error('다운로드할 이미지 URL이 없어요')
}

async function fetchWith429Retry(url: string, signal: AbortSignal): Promise<Response> {
  let attempt = 0

  while (attempt <= MAX_429_RETRIES) {
    if (signal.aborted) {
      throw new DOMException('다운로드가 취소됐어요', 'AbortError')
    }

    const response = await runThrottledDownloadAttempt(url, signal)

    if (response.status !== 429) {
      return response
    }

    if (attempt === MAX_429_RETRIES) {
      return response
    }

    await sleep(getRetryAfterMs(response.headers.get('Retry-After')))
    attempt++
  }

  throw new Error('다운로드에 실패했어요')
}

function getRetryAfterMs(retryAfterHeader: string | null): number {
  if (!retryAfterHeader) {
    return DEFAULT_429_RETRY_DELAY_MS
  }

  const retryAfterSeconds = Number(retryAfterHeader)

  if (Number.isFinite(retryAfterSeconds)) {
    return Math.max(0, retryAfterSeconds * 1000)
  }

  const retryAfterDate = Date.parse(retryAfterHeader)

  if (Number.isNaN(retryAfterDate)) {
    return DEFAULT_429_RETRY_DELAY_MS
  }

  return Math.max(0, retryAfterDate - Date.now())
}

function getSaveFilePicker(): SaveFilePicker {
  const saveFilePicker = (window as Window & { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker

  if (!window.isSecureContext || !saveFilePicker) {
    throw new DownloadNotSupportedError()
  }

  return saveFilePicker.bind(window)
}

function sanitizeDownloadFilename(filename: string): string {
  const withoutControlCharacters = Array.from(filename, (character) =>
    character.charCodeAt(0) < 32 ? '_' : character,
  ).join('')

  const sanitized = withoutControlCharacters
    .replace(/[<>:"/\\|?*]/gu, '_')
    .replace(/\s+/gu, ' ')
    .trim()
    .slice(0, 180)

  return sanitized || 'litomi-download'
}
