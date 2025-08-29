'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

import useReadingHistory from '@/app/manga/[id]/useReadingHistory'
import { useImageIndexStore } from '@/components/ImageViewer/store/imageIndex'

type Props = {
  mangaId: number
}

export default function ResumeReadingToast({ mangaId }: Readonly<Props>) {
  const navigateToImageIndex = useImageIndexStore((state) => state.navigateToImageIndex)
  const { lastPage } = useReadingHistory(mangaId)

  useEffect(() => {
    if (lastPage) {
      const toastId = toast(`마지막으로 읽던 페이지 ${lastPage}`, {
        duration: 5_000,
        action: {
          label: '이동',
          onClick: () => navigateToImageIndex(lastPage - 1),
        },
      })

      return () => {
        toast.dismiss(toastId)
      }
    }
  }, [lastPage, navigateToImageIndex])

  return null
}
