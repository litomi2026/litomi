'use client'

import { useEffect } from 'react'
import { toast } from 'sonner'

import useReadingHistory from '@/app/manga/[id]/useReadingHistory'
import { useImageIndexStore } from '@/components/ImageViewer/store/imageIndex'

import { MangaIdSearchParam } from './common'

type Props = {
  mangaId: number
}

export default function ResumeReadingToast({ mangaId }: Readonly<Props>) {
  const imageIndex = useImageIndexStore((state) => state.imageIndex)
  const { lastPage } = useReadingHistory(mangaId)

  useEffect(() => {
    if (lastPage && lastPage > 1 && imageIndex === 0) {
      const toastId = toast(`마지막으로 읽던 페이지 ${lastPage}`, {
        duration: 10_000,
        action: {
          label: '이동',
          onClick: () => {
            const url = new URL(window.location.href)
            url.searchParams.set(MangaIdSearchParam.PAGE, String(lastPage))
            window.history.replaceState({}, '', url.toString())
          },
        },
      })

      return () => {
        toast.dismiss(toastId)
      }
    }
  }, [lastPage, imageIndex])

  return null
}
