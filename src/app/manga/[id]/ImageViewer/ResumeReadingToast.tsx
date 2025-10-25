'use client'

import { useQueryClient } from '@tanstack/react-query'
import ms from 'ms'
import { useEffect } from 'react'
import { toast } from 'sonner'

import { QueryKeys } from '@/constants/query'
import { Manga } from '@/types/manga'

import { useImageIndexStore } from './store/imageIndex'
import { usePageViewStore } from './store/pageView'
import { useVirtualScrollStore } from './store/virtualizer'
import useReadingHistory from './useReadingHistory'

type Props = {
  manga: Manga
}

export default function ResumeReadingToast({ manga }: Readonly<Props>) {
  const { id: mangaId, images = [] } = manga
  const imageCount = images.length
  const getImageIndex = useImageIndexStore((state) => state.getImageIndex)
  const navigateToImageIndex = useImageIndexStore((state) => state.navigateToImageIndex)
  const { lastPage } = useReadingHistory(mangaId)
  const pageView = usePageViewStore((state) => state.pageView)
  const isDoublePage = pageView === 'double'
  const queryClient = useQueryClient()
  const scrollToRow = useVirtualScrollStore((state) => state.scrollToRow)

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
            scrollToRow(isDoublePage ? Math.floor((lastPage - 1) / 2) : lastPage - 1)
          },
        },
      })

      return () => {
        toast.dismiss(toastId)
      }
    }
  }, [lastPage, navigateToImageIndex, getImageIndex, imageCount, scrollToRow, isDoublePage])

  // NOTE: 뷰어 들어오면 최신 감상 기록으로 갱신
  useEffect(() => {
    queryClient.invalidateQueries({ queryKey: QueryKeys.readingHistory(mangaId) })
  }, [mangaId, queryClient])

  return null
}
