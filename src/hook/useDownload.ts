import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { ImageWithVariants } from '@/types/manga'
import { downloadImage, downloadMultipleImages } from '@/utils/download'

// Supported image extensions
const VALID_IMAGE_EXTENSIONS = new Set(['avif', 'bmp', 'gif', 'jpeg', 'jpg', 'png', 'svg', 'webp'])

type Props = {
  manga: {
    id: number
    title: string
    images?: ImageWithVariants[]
  }
}

export function useDownload({ manga }: Props) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadedCount, setDownloadedCount] = useState(0)

  const downloadSingleImage = useCallback(
    async (imageIndex: number) => {
      if (isDownloading) {
        return
      }

      setIsDownloading(true)

      try {
        const { title, images = [] } = manga
        const image = images[imageIndex]
        const imageURL = image?.original?.url ?? image?.thumbnail?.url ?? ''
        const extension = getImageExtension(imageURL)
        const filename = `${title} ${imageIndex + 1}${extension}`

        await downloadImage(imageURL, filename)
        toast.success('다운로드가 완료됐어요')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '다운로드에 실패했어요')
      } finally {
        setIsDownloading(false)
      }
    },
    [manga, isDownloading],
  )

  const downloadAllImages = useCallback(async () => {
    if (isDownloading) {
      return
    }

    setIsDownloading(true)
    setDownloadedCount(0)

    try {
      const { id, title, images = [] } = manga

      const imageList = images.map(({ original, thumbnail }, index) => {
        const url = original?.url ?? thumbnail?.url ?? ''
        const extension = getImageExtension(url)
        return {
          url,
          filename: `${index}${extension}`,
        }
      })

      await downloadMultipleImages({
        filename: `${id}-${title}`,
        images: imageList,
        onProgress: (completed) => setDownloadedCount(completed),
      })

      toast.success('다운로드가 완료됐어요')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '다운로드에 실패했어요')
    } finally {
      setIsDownloading(false)
      setDownloadedCount(0)
    }
  }, [manga, isDownloading])

  return {
    isDownloading,
    downloadedCount,
    downloadSingleImage,
    downloadAllImages,
  }
}

/**
 * Extracts image extension from a URL, handling query parameters and fragments
 * @param imageURL - The image URL to parse
 * @returns A valid image extension or 'jpg' as fallback
 */
function getImageExtension(imageURL: string): string {
  try {
    // Parse URL to get pathname without query params or fragments
    const url = new URL(imageURL, 'https://example.com')
    const pathname = url.pathname

    // Extract filename from pathname
    const filename = pathname.split('/').pop() || ''

    // Get extension from filename (after last dot)
    const lastDotIndex = filename.lastIndexOf('.')
    if (lastDotIndex === -1 || lastDotIndex === filename.length - 1) {
      return ''
    }

    const extension = filename.slice(lastDotIndex + 1).toLowerCase()

    // Validate extension against known image formats
    if (VALID_IMAGE_EXTENSIONS.has(extension)) {
      return `.${extension}`
    }

    // Default to jpg for unrecognized extensions
    return '.jpg'
  } catch {
    // Fallback for invalid URLs or other errors
    return ''
  }
}
