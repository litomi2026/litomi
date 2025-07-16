import { NEXT_PUBLIC_CORS_PROXY_URL } from '@/constants/env'

export async function downloadImage(imageUrl: string, filename: string): Promise<void> {
  try {
    // Use CORS proxy if available and needed
    const url =
      NEXT_PUBLIC_CORS_PROXY_URL && !imageUrl.startsWith('blob:') && !imageUrl.startsWith('data:')
        ? `${NEXT_PUBLIC_CORS_PROXY_URL}?url=${encodeURIComponent(imageUrl)}`
        : imageUrl

    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`)
    }

    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    // Create download link
    const link = document.createElement('a')
    link.href = blobUrl
    link.download = filename
    link.style.display = 'none'

    document.body.appendChild(link)
    link.click()

    // Cleanup
    document.body.removeChild(link)
    URL.revokeObjectURL(blobUrl)
  } catch (error) {
    throw new Error(error instanceof Error ? error.message : '다운로드에 실패했어요')
  }
}

export async function downloadMultipleImages({
  filename,
  images,
  onProgress,
}: {
  filename: string
  images: { url: string; filename: string }[]
  onProgress?: (completed: number) => void
}): Promise<void> {
  const JSZip = (await import('jszip')).default
  const zip = new JSZip()

  let completed = 0
  let successCount = 0

  await Promise.all(
    images.map(async ({ url, filename }) => {
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
    }),
  )

  if (successCount === 0) {
    throw new Error('모든 이미지를 다운로드할 수 없어요')
  }

  const content = await zip.generateAsync({ type: 'blob' })
  const url = URL.createObjectURL(content)

  const link = document.createElement('a')
  link.href = url
  link.download = `${filename}.zip`
  link.click()

  URL.revokeObjectURL(url)
}
