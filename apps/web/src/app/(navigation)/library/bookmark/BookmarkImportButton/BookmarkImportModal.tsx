'use client'

import type { POSTV1BookmarkResponse } from '@litomi/contracts/api/bookmark'

import { MAX_BOOKMARK_BATCH_SIZE } from '@litomi/domain/constants/policy'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

import MangaImportModal from '@/components/card/MangaImportModal'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { ProblemDetailsError } from '@/utils/react-query-error'

import { addBookmarks } from '../api'
import { useBookmarkImportModalStore } from './store'

export default function BookmarkImportModal() {
  const queryClient = useQueryClient()
  const { isOpen, setIsOpen } = useBookmarkImportModalStore()
  const router = useRouter()

  const mutation = useMutation<POSTV1BookmarkResponse, ProblemDetailsError, { mangaIds: number[] }>({
    mutationFn: addBookmarks,

    onSuccess: async ({ createdMangaIds, duplicateCount, overflowCount }) => {
      const createdCount = createdMangaIds.length

      if (createdCount > 0) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: QueryKeys.bookmarks }),
          queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteBookmarksBase }),
          queryClient.invalidateQueries({ queryKey: QueryKeys.librarySummaryBase }),
        ])

        const summary: string[] = []

        if (duplicateCount > 0) {
          summary.push(`중복 ${duplicateCount}개`)
        }
        if (overflowCount > 0) {
          summary.push(`한도 초과 ${overflowCount}개`)
        }

        const suffix = summary.length > 0 ? ` (${summary.join(', ')})` : ''
        toast.success(`${createdCount}개 작품을 북마크했어요${suffix}`)
        setIsOpen(false)
        router.refresh()
        return
      }

      toast.warning(getNoopBookmarkMessage(duplicateCount, overflowCount))
    },
  })

  function handleAfterClose() {
    mutation.reset()
  }

  function handleSubmit(mangaIds: number[]) {
    mutation.mutate({ mangaIds })
  }

  function handleClose() {
    setIsOpen(false)
  }

  return (
    <MangaImportModal
      isPending={mutation.isPending}
      maxCount={MAX_BOOKMARK_BATCH_SIZE}
      onAfterClose={handleAfterClose}
      onClose={handleClose}
      onSubmit={handleSubmit}
      open={isOpen}
    />
  )
}

function getNoopBookmarkMessage(duplicateCount: number, overflowCount: number) {
  if (duplicateCount > 0 && overflowCount === 0) {
    return `${duplicateCount}개 작품이 이미 북마크돼 있어요`
  }

  if (overflowCount > 0 && duplicateCount === 0) {
    return `${overflowCount}개 작품은 북마크 한도 때문에 추가하지 못했어요`
  }

  if (duplicateCount > 0 && overflowCount > 0) {
    return `새로 추가된 북마크가 없어요 (중복 ${duplicateCount}개, 한도 초과 ${overflowCount}개)`
  }

  return '북마크를 추가하지 못했어요'
}
