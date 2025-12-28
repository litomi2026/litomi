import { env } from '@/env/client'

const { NEXT_PUBLIC_CORS_PROXY_URL } = env

export function downloadBlob(blob: Blob, filename: string) {
  const blobURL = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobURL
  link.download = filename
  link.click()
  URL.revokeObjectURL(blobURL)
}

export async function downloadImage(imageUrl: string, filename: string): Promise<void> {
  try {
    const url =
      NEXT_PUBLIC_CORS_PROXY_URL && !imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:')
        ? `${NEXT_PUBLIC_CORS_PROXY_URL}?url=${encodeURIComponent(imageUrl)}`
        : imageUrl

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }

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
  images: { url: string; filename: string }[]
  onProgress?: (completed: number) => void
  maxConcurrent?: number
}): Promise<void> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  let completed = 0
  let successCount = 0
  let currentIndex = 0

  const downloadImage = async ({ url, filename }: { url: string; filename: string }) => {
    try {
      const corsUrl =
        NEXT_PUBLIC_CORS_PROXY_URL && !url.startsWith('blob:') && !url.startsWith('data:')
          ? `${NEXT_PUBLIC_CORS_PROXY_URL}?url=${encodeURIComponent(url)}`
          : url

      const response = await fetch(corsUrl)

      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`)
      }

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
