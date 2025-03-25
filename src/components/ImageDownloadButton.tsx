'use client'

import { Manga } from '@/types/manga'
import { fetchImageWithRetry } from '@/utils/browser'
import { getImageSrc } from '@/utils/manga'
import { useCallback } from 'react'
import { toast } from 'sonner'

const MAX_ZIP_SIZE = 50_000_000 // 50MB

type Props = {
  manga: Manga
}

const updateProgressToast = (message: string) => {
  toast.custom(() => <div className="p-4 bg-background border-2 border-zinc-600 rounded-xl min-w-3xs">{message}</div>, {
    id: 'progress-toast',
    duration: Infinity,
  })
}

const saveAs = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function ImageDownloadButton({ manga }: Props) {
  const handleDownload = useCallback(async () => {
    const { id, images, cdn, title } = manga
    const { default: JSZip } = await import('jszip')

    const totalImages = images.length
    let downloadedCount = 0
    let failedCount = 0
    const validImages: { idx: number; blob: Blob; size: number; imgName: string }[] = []

    // 이미지 다운로드
    for (let i = 0; i < totalImages; i++) {
      const imgName = images[i]
      const progress = ((downloadedCount / totalImages) * 100).toFixed(0)
      const failedText = failedCount > 0 ? `, ${failedCount}개 실패` : ''
      updateProgressToast(`이미지 다운로드 중: ${downloadedCount} / ${totalImages}개 (${progress}%${failedText})`)
      const url = getImageSrc({ path: imgName, cdn, id: +id })
      try {
        const blob = await fetchImageWithRetry(url)
        downloadedCount++
        validImages.push({ idx: i, blob, size: blob.size, imgName })
      } catch {
        downloadedCount++
        failedCount++
      }
    }

    updateProgressToast('이미지 압축 중...')

    let currentZip = new JSZip()
    let currentZipSize = 0
    let zipCount = 1
    const zipFiles: { blob: Blob; count: number }[] = []

    // 이미지들을 zip에 추가하고, 크기가 MAX_ZIP_SIZE를 초과하면 분할
    for (const { idx, blob, size, imgName } of validImages) {
      if (currentZipSize + size > MAX_ZIP_SIZE && currentZipSize > 0) {
        const zipBlob = await currentZip.generateAsync({ type: 'blob' })
        zipFiles.push({ blob: zipBlob, count: zipCount })
        zipCount++
        currentZip = new JSZip()
        currentZipSize = 0
      }
      const extMatch = imgName.match(/\.(\w+)$/)
      const ext = extMatch ? extMatch[1] : 'img'
      currentZip.file(`${id}_${idx}.${ext}`, blob)
      currentZipSize += size
    }

    if (currentZipSize > 0) {
      const zipBlob = await currentZip.generateAsync({ type: 'blob' })
      zipFiles.push({ blob: zipBlob, count: zipCount })
    }

    // 각 zip 파일 저장
    zipFiles.forEach(({ blob, count }) => {
      const countText = zipFiles.length > 1 ? ` - ${count}` : ''
      saveAs(blob, `${title || id}${countText}.zip`)
    })

    updateProgressToast('✅ 이미지 다운로드 및 압축 완료')

    setTimeout(() => {
      toast.dismiss('progress-toast')
    }, 3000)
  }, [manga])

  return (
    <button
      className="text-white rounded border-2 border-zinc-700 hover:bg-zinc-800 active:bg-zinc-950 transition p-1 text-sm"
      onClick={handleDownload}
    >
      이미지 다운로드
    </button>
  )
}
