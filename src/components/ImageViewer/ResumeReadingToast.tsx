'use client'

import { useQueryClient } from '@tanstack/react-query'
import ms from 'ms'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { QueryKeys } from '@/constants/query'
import { Manga } from '@/types/manga'

import { useImageIndexStore } from './store/imageIndex'
import { useVirtualizerStore } from './store/virtualizer'
import useReadingHistory from './useReadingHistory'

type Props = {
  manga: Manga
}

export default function ResumeReadingToast({ manga }: Readonly<Props>) {
  const { id: mangaId, images } = manga
  const imageCount = images.length
  const getImageIndex = useImageIndexStore((state) => state.getImageIndex)
  const navigateToImageIndex = useImageIndexStore((state) => state.navigateToImageIndex)
  const { lastPage } = useReadingHistory(mangaId)
  const queryClient = useQueryClient()
  const getVirtualizer = useVirtualizerStore((state) => state.getVirtualizer)

  // NOTE: 읽은 페이지 토스트 표시
  useEffect(() => {
    const currentPage = getImageIndex() + 1

    if (lastPage && lastPage !== currentPage && lastPage !== imageCount) {
      const toastId = toast(`마지막으로 읽던 페이지 ${lastPage}`, {
        duration: ms('10 seconds'),
        action: {
          label: '이동',
          onClick: () => {
            navigateToImageIndex(lastPage - 1)
            getVirtualizer()?.scrollToIndex(lastPage - 1)
          },
        },
      })

      return () => {
        toast.dismiss(toastId)
      }
    }
  }, [lastPage, navigateToImageIndex, getImageIndex, imageCount, getVirtualizer])

  // NOTE: 뷰어 들어오면 최신 감상 기록으로 갱신
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.readingHistory(mangaId) })
  }, [mangaId, queryClient])

  return null
}
