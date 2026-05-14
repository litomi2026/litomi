'use client'

import type { POSTV1LibraryItemCopyBody, POSTV1LibraryItemCopyResponse } from '@litomi/contracts'

import { MAX_ITEMS_PER_LIBRARY } from '@litomi/domain/constants/policy'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { bulkCopyToLibrary } from '@/app/(navigation)/library/api'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { ProblemDetailsError } from '@/utils/react-query-error'

import MangaImportModal from '../../../../components/card/MangaImportModal'
import { useImportMangaModalStore } from './store'

export default function LibraryItemImportModal() {
  const { libraryId, setLibraryId } = useImportMangaModalStore()
  const queryClient = useQueryClient()

  const bulkImportMutation = useMutation<POSTV1LibraryItemCopyResponse, ProblemDetailsError, POSTV1LibraryItemCopyBody>(
    {
      mutationFn: bulkCopyToLibrary,

      onSuccess: async ({ copiedCount: successCount }, { mangaIds, toLibraryId }) => {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItemsBase(toLibraryId) }),
          queryClient.invalidateQueries({ queryKey: QueryKeys.libraries }),
        ])

        const failedCount = mangaIds.length - successCount
        const extraMessage = failedCount > 0 ? ` (중복 ${failedCount}개)` : ''
        toast.success(`${successCount}개 작품을 가져왔어요${extraMessage}`)
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
      toast.warning('서재를 선택해 주세요')
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
