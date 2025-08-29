'use client'

import ms from 'ms'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { useImageIndexStore } from './store/imageIndex'
import useReadingHistory from './useReadingHistory'

type Props = {
  mangaId: number
}

export default function ResumeReadingToast({ mangaId }: Readonly<Props>) {
  const navigateToImageIndex = useImageIndexStore((state) => state.navigateToImageIndex)
  const { lastPage } = useReadingHistory(mangaId)

  useEffect(() => {
    if (lastPage) {
      const toastId = toast(`마지막으로 읽던 페이지 ${lastPage}`, {
        duration: ms('5 seconds'),
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
