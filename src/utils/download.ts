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
      const response = await fetchDownloadResponse(urls?.length ? urls : url ?? '')
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

async function fetchDownloadResponse(imageURL: string | string[]): Promise<Response> {
  const candidates = (Array.isArray(imageURL) ? imageURL : [imageURL]).filter(Boolean)
  let lastError: Error | undefined

  for (const candidate of candidates) {
    try {
      const response = await fetch(candidate)

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
