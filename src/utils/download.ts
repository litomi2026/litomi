const MAX_DOWNLOAD_REQUESTS_PER_SECOND = 5
const DOWNLOAD_REQUEST_INTERVAL_MS = Math.ceil(1000 / MAX_DOWNLOAD_REQUESTS_PER_SECOND)
const DEFAULT_429_RETRY_DELAY_MS = 1000
const MAX_429_RETRIES = 3

let nextDownloadRequestAt = 0
let downloadRequestQueue: Promise<void> = Promise.resolve()

export function downloadBlob(blob: Blob, filename: string) {
  const blobURL = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobURL
  link.download = filename
  link.click()
  URL.revokeObjectURL(blobURL)
}

export async function downloadImage(imageUrl: string | string[], filename: string): Promise<void> {
  try {
    const response = await fetchDownloadResponse(imageUrl)
    const blob = await response.blob()
    downloadBlob(blob, filename)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '다운로드에 실패했어요')
  }
}

export async function downloadMultipleImages({
  filename,
  images,
  onProgress,
  maxConcurrent = 10,
}: {
  filename: string
  images: { filename: string; url?: string; urls?: string[] }[]
  onProgress?: (completed: number) => void
  maxConcurrent?: number
}): Promise<void> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  let completed = 0
  let successCount = 0
  let currentIndex = 0

  const downloadImage = async ({ url, urls, filename }: { filename: string; url?: string; urls?: string[] }) => {
    try {
      const response = await fetchDownloadResponse(urls?.length ? urls : (url ?? ''))
      const blob = await response.blob()
      zip.file(filename, blob)

      successCount++
      completed++
      onProgress?.(completed)
    } catch (error) {
      console.error(`Failed to download ${filename}:`, error)
      completed++
      onProgress?.(completed)
    }
  }

  const downloadPool = async () => {
    const activeDownloads: Promise<void>[] = []

    while (currentIndex < images.length && activeDownloads.length < maxConcurrent) {
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

export function resetDownloadRequestRateLimiter() {
  nextDownloadRequestAt = 0
  downloadRequestQueue = Promise.resolve()
}

async function fetchDownloadResponse(imageURL: string | string[]): Promise<Response> {
  const candidates = (Array.isArray(imageURL) ? imageURL : [imageURL]).filter(Boolean)
  let lastError: Error | undefined

  for (const candidate of candidates) {
    try {
      const response = await fetchWith429Retry(candidate)

      if (response.ok) {
        return response
      }

      lastError = new Error(`${response.status} ${response.statusText}`)
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('다운로드에 실패했어요')
    }
  }

  throw lastError ?? new Error('다운로드할 이미지 URL이 없어요')
}

async function fetchWith429Retry(url: string): Promise<Response> {
  let attempt = 0

  while (attempt <= MAX_429_RETRIES) {
    await waitForDownloadRequestTurn()

    const response = await fetch(url, { credentials: 'include' })

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

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForDownloadRequestTurn(): Promise<void> {
  const scheduledRequest = downloadRequestQueue.then(async () => {
    const now = Date.now()
    const waitMs = Math.max(0, nextDownloadRequestAt - now)

    nextDownloadRequestAt = Math.max(now, nextDownloadRequestAt) + DOWNLOAD_REQUEST_INTERVAL_MS

    if (waitMs > 0) {
      await sleep(waitMs)
    }
  })

  downloadRequestQueue = scheduledRequest.catch(() => {})
  await scheduledRequest
}
