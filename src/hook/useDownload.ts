import { useCallback, useState } from 'react'
import { toast } from 'sonner'

import { Manga } from '@/types/manga'
import { downloadImage, downloadMultipleImages } from '@/utils/download'
import { getImageSrc } from '@/utils/manga'

export function useDownload(manga: Manga) {
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadedCount, setDownloadedCount] = useState(0)

  const downloadSingleImage = useCallback(
    async (imageIndex: number) => {
      if (isDownloading) return

      setIsDownloading(true)

      try {
        const { id, title, images, cdn } = manga
        const imageUrl = getImageSrc({ cdn, id, path: images[imageIndex] })
        const filename = `${title} ${imageIndex + 1}.jpg`

        await downloadImage(imageUrl, filename)
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
    if (isDownloading) return

    setIsDownloading(true)
    setDownloadedCount(0)

    try {
      const { id, title, images, cdn } = manga

      const imageList = images.map((image, index) => ({
        url: getImageSrc({ cdn, id, path: image }),
        filename: `${String(index + 1).padStart(Math.log10(images.length) + 1, '0')}.jpg`,
      }))

      await downloadMultipleImages({
        filename: title,
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
