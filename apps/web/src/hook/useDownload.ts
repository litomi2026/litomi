import type { ImageWithVariants } from '@litomi/domain/manga/model'

import { createLitomiProxyMangaImageURL, createThirdPartyMangaImageURLs } from '@litomi/http/image-proxy'
import { useTranslations } from 'next-intl'
import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { showAdultVerificationRecommendedToast, showLoginRequiredToast } from '@/lib/toast'
import useMeQuery from '@/query/useMeQuery'
import { isAdultVerified } from '@/utils/adult-verification'
import { downloadMultipleImages } from '@/utils/download'

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
  const { data: me } = useMeQuery()
  const t = useTranslations('Common.mangaCard.download')
  const tErrors = useTranslations('Errors')

  const downloadAllImages = useCallback(async () => {
    if (isDownloading) {
      return
    }

    if (!isAdultVerified(me)) {
      if (me) {
        showAdultVerificationRecommendedToast(t('adultHint'))
      } else {
        showLoginRequiredToast(t('loginHint'))
      }
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

      toast.success(t('completed'))
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        toast.info(t('canceled'))
      } else if (navigator.onLine === false) {
        toast.error(tErrors('status.offline'))
      } else {
        toast.error(t('failed'))
      }
    } finally {
      setIsDownloading(false)
      setDownloadedCount(0)
    }
  }, [isDownloading, manga, me, t, tErrors])

  return {
    isDownloading,
    downloadedCount,
    downloadAllImages,
    me,
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

  const semanticExternalURLs = createThirdPartyMangaImageURLs({
    mangaId,
    page,
    variant: 'original',
  })

  const semanticMaterializeURLs = Array.from(new Set([externalImageURL, ...semanticExternalURLs]))

  const semanticMaterializeProxyURLs = semanticMaterializeURLs.map((sourceURL) =>
    createLitomiProxyMangaImageURL({
      sourceURL,
      mangaId,
      page,
      variant: 'original',
    }),
  )

  return semanticMaterializeProxyURLs.filter(Boolean)
}
