'use client'

import { useQueryClient } from '@tanstack/react-query'
import ms from 'ms'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { QueryKeys } from '@/constants/query'

import { useImageIndexStore } from './store/imageIndex'
import useReadingHistory from './useReadingHistory'

type Props = {
  mangaId: number
}

export default function ResumeReadingToast({ mangaId }: Readonly<Props>) {
  const getImageIndex = useImageIndexStore((state) => state.getImageIndex)
  const navigateToImageIndex = useImageIndexStore((state) => state.navigateToImageIndex)
  const { lastPage } = useReadingHistory(mangaId)
  const queryClient = useQueryClient()

  // NOTE: 읽은 페이지 토스트 표시
  useEffect(() => {
    if (lastPage && lastPage !== getImageIndex() + 1) {
      const toastId = toast(`마지막으로 읽던 페이지 ${lastPage}`, {
        duration: ms('10 seconds'),
        action: {
          label: '이동',
          onClick: () => navigateToImageIndex(lastPage - 1),
        },
      })

      return () => {
        toast.dismiss(toastId)
      }
    }
  }, [lastPage, navigateToImageIndex, getImageIndex])

  // NOTE: 뷰어 들어오면 최신 감상 기록으로 갱신
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.readingHistory(mangaId) })
  }, [mangaId, queryClient])

  return null
}
