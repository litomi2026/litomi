'use client'

import type { POSTV1BookmarkResponse } from '@litomi/contracts'

import { MAX_BOOKMARK_BATCH_SIZE } from '@litomi/domain/library/policy'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import MangaImportModal from '@/components/card/MangaImportModal'
import useAdultAccessGuard from '@/hook/useAdultAccessGuard'
import { useRouter } from '@/i18n/navigation'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { ProblemDetailsError } from '@/utils/api-request'

import { addBookmarks } from '../api'
import { useBookmarkImportModalStore } from './store'

export default function BookmarkImportModal() {
  const { isOpen, setIsOpen } = useBookmarkImportModalStore()
  const { guardAdultAccess } = useAdultAccessGuard()
  const queryClient = useQueryClient()
  const router = useRouter()
  const t = useTranslations('Library.bookmark')

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
          summary.push(t('duplicateSummary', { count: duplicateCount }))
        }
        if (overflowCount > 0) {
          summary.push(t('overflowSummary', { count: overflowCount }))
        }

        const suffix = summary.length > 0 ? ` (${summary.join(', ')})` : ''
        toast.success(t('imported', { count: createdCount, extra: suffix }))
        setIsOpen(false)
        router.refresh()
        return
      }

      if (duplicateCount > 0 && overflowCount === 0) {
        toast.warning(t('noopDuplicate', { count: duplicateCount }))
        return
      }

      if (overflowCount > 0 && duplicateCount === 0) {
        toast.warning(t('noopOverflow', { count: overflowCount }))
        return
      }

      if (duplicateCount > 0 && overflowCount > 0) {
        toast.warning(t('noopMixed', { duplicateCount, overflowCount }))
        return
      }

      toast.warning(t('noopFailed'))
    },
  })

  function handleAfterClose() {
    mutation.reset()
  }

  function handleSubmit(mangaIds: number[]) {
    if (!guardAdultAccess()) {
      return
    }

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
