'use client'

import type { POSTV1LibraryItemCopyBody, POSTV1LibraryItemCopyResponse } from '@litomi/contracts'

import { MAX_ITEMS_PER_LIBRARY } from '@litomi/domain/library/policy'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'

import { bulkCopyToLibrary } from '@/app/[locale]/(navigation)/library/api'
import MangaImportModal from '@/components/card/MangaImportModal'
import { QueryKeys } from '@/lib/react-query/query-keys'
import type { ProblemDetailsError } from '@/utils/fetch-response'

import { useImportMangaModalStore } from './store'

export default function LibraryItemImportModal() {
  const { libraryId, setLibraryId } = useImportMangaModalStore()
  const queryClient = useQueryClient()
  const t = useTranslations('Library.import')
  const bulkT = useTranslations('Library.bulk')

  const bulkImportMutation = useMutation<POSTV1LibraryItemCopyResponse, ProblemDetailsError, POSTV1LibraryItemCopyBody>(
    {
      mutationFn: bulkCopyToLibrary,

      onSuccess: async ({ copiedCount: successCount }, { mangaIds, toLibraryId }) => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItemsBase(toLibraryId) }),
          queryClient.invalidateQueries({ queryKey: QueryKeys.libraries }),
        ])

        const failedCount = mangaIds.length - successCount
        const extraMessage = failedCount > 0 ? bulkT('duplicateSuffix', { count: failedCount }) : ''
        toast.success(t('success', { count: successCount, extra: extraMessage }))
        handleClose()
      },
    },
  )

  function handleClose() {
    setLibraryId(null)
  }

  function handleAfterClose() {
    bulkImportMutation.reset()
  }

  function handleImport(mangaIds: number[]) {
    if (!libraryId) {
      toast.warning(t('selectLibraryWarning'))
      return
    }

    bulkImportMutation.mutate({ mangaIds, toLibraryId: libraryId })
  }

  return (
    <MangaImportModal
      isPending={bulkImportMutation.isPending}
      maxCount={MAX_ITEMS_PER_LIBRARY}
      onAfterClose={handleAfterClose}
      onClose={handleClose}
      onSubmit={handleImport}
      open={Boolean(libraryId)}
    />
  )
}
