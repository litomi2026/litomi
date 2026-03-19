import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import type { ImageWithVariants } from '@/types/manga'

import { showAdultVerificationRecommendedToast, showLoginRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'
import { getAdultState, hasAdultAccess } from '@/utils/adult-verification'
import { downloadMultipleImages } from '@/utils/download'
import { createEquivalentMangaImageSourceURLs, createMangaImageProxyRequestURL } from '@/utils/image-proxy'

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
  const { data: me } = useMeQuery()
  const adultState = getAdultState(me)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadedCount, setDownloadedCount] = useState(0)

  const downloadAllImages = useCallback(async () => {
    if (isDownloading) {
      return
    }

    if (!me) {
      showLoginRequiredToast()
      return
    }

    if (!hasAdultAccess(adultState)) {
      showAdultVerificationRecommendedToast({ username: me.name })
    }

    setIsDownloading(true)
    setDownloadedCount(0)

    try {
      const { id, title, images = [] } = manga

      const imageList = images.map(({ original, thumbnail }, index) => {
        const url = original?.url ?? thumbnail?.url ?? ''
        const extension = getImageExtension(url)

        return {
          urls: getSemanticDownloadCandidates({
            mangaId: id,
            imageIndex: index,
            externalImageURL: url,
          }),
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
      if (error instanceof Error && error.name === 'AbortError') {
        toast.info('다운로드가 취소됐어요')
      } else if (navigator.onLine === false) {
        toast.error('네트워크 연결을 확인해 주세요')
      } else {
        toast.error('다운로드에 실패했어요')
      }
    } finally {
      setIsDownloading(false)
      setDownloadedCount(0)
    }
  }, [adultState, isDownloading, manga, me])

  return {
    adultState,
    isDownloading,
    downloadedCount,
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

function getSemanticDownloadCandidates({
  mangaId,
  imageIndex,
  externalImageURL,
}: {
  mangaId: number
  imageIndex: number
  externalImageURL: string
}): string[] {
  if (mangaId <= 0) {
    return externalImageURL ? [externalImageURL] : []
  }

  const page = imageIndex + 1

  const semanticExternalURLs = createEquivalentMangaImageSourceURLs({
    mangaId,
    page,
    variant: 'original',
  })

  const semanticMaterializeURLs = Array.from(new Set([externalImageURL, ...semanticExternalURLs]))

  const semanticMaterializeProxyURLs = semanticMaterializeURLs.map((sourceURL) =>
    createMangaImageProxyRequestURL({
      sourceURL,
      mangaId,
      page,
      variant: 'original',
    }),
  )

  return semanticMaterializeProxyURLs.filter(Boolean)
}
