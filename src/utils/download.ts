import pLimit from 'p-limit'
import pThrottle from 'p-throttle'
import { toast } from 'sonner'

import { sleep } from './time'

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

const downloadThrottle = pThrottle({
  limit: MAX_DOWNLOAD_REQUESTS_PER_SECOND,
  interval: DOWNLOAD_REQUEST_INTERVAL_MS,
  strict: true,
})

const runThrottledDownloadAttempt = downloadThrottle((url: string) => fetch(url, { credentials: 'include' }))

export function downloadBlob(blob: Blob, filename: string) {
  const blobURL = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobURL
  link.download = filename
  link.click()
  URL.revokeObjectURL(blobURL)
}

export async function downloadMultipleImages({ filename, images, onProgress }: Options) {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  let completed = 0
  let successCount = 0
  let currentIndex = 0

  const downloadImage = async ({ url, urls, filename }: { filename: string; url?: string; urls?: string[] }) => {
    try {
      const blob = await fetchDownloadBlob(urls?.length ? urls : (url ?? ''))
      zip.file(filename, blob)

      successCount++
      completed++
      onProgress?.(completed)
    } catch (error) {
      toast.error(`다운로드 실패: ${filename}: ${error instanceof Error ? error.message : error}`)
      completed++
      onProgress?.(completed)
    }
  }

  const downloadPool = async () => {
    const activeDownloads: Promise<void>[] = []

    // Limit how many image jobs a single batch can queue at once.
    while (currentIndex < images.length && activeDownloads.length < MAX_DOWNLOAD_CONCURRENT_REQUESTS) {
      const image = images[currentIndex]
      currentIndex++
      activeDownloads.push(downloadImage(image))
    }

    while (activeDownloads.length > 0) {
      const completedIndex = await Promise.race(activeDownloads.map((promise, index) => promise.then(() => index)))

      activeDownloads.splice(completedIndex, 1)

      if (currentIndex < images.length) {
        const image = images[currentIndex]
        currentIndex++
        activeDownloads.push(downloadImage(image))
      }
    }
  }

  await downloadPool()

  if (successCount === 0) {
    throw new Error('모든 이미지를 다운로드할 수 없어요')
  }

  const zipFile = await zip.generateAsync({ type: 'blob' })
  downloadBlob(zipFile, `${filename}.zip`)
}

async function fetchDownloadBlob(imageURL: string | string[]): Promise<Blob> {
  const candidates = (Array.isArray(imageURL) ? imageURL : [imageURL]).filter(Boolean)

  return downloadConcurrencyLimit(async () => {
    let lastError: Error | undefined

    for (const candidate of candidates) {
      try {
        const response = await fetchWith429Retry(candidate)

        if (response.ok) {
          return response.blob()
        }

        lastError = new Error([response.status, response.statusText].filter(Boolean).join(' '))
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('다운로드에 실패했어요')
      }
    }

    throw lastError ?? new Error('다운로드할 이미지 URL이 없어요')
  })
}

async function fetchWith429Retry(url: string): Promise<Response> {
  let attempt = 0

  while (attempt <= MAX_429_RETRIES) {
    const response = await runThrottledDownloadAttempt(url)

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
