'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { FolderInput } from 'lucide-react'
import { toast } from 'sonner'

import { QueryKeys } from '@/constants/query'
import { ProblemDetailsError } from '@/utils/react-query-error'

import type { BulkActionDescriptor, BulkTargetLibrary } from './bulkActionTypes'

import { bulkMoveToLibrary } from './api'
import { useLibrarySelection } from './librarySelection'

type Options = {
  currentLibraryId?: number
  libraries: BulkTargetLibrary[]
}

export default function useBulkMoveToLibraryAction({
  currentLibraryId,
  libraries,
}: Readonly<Options>): BulkActionDescriptor {
  const queryClient = useQueryClient()
  const { exit, selectedCount, selectedIds } = useLibrarySelection()

  const mutation = useMutation({
    mutationFn: bulkMoveToLibrary,
    onSuccess: ({ movedCount }, { fromLibraryId, mangaIds, toLibraryId }) => {
      const alreadyExistsCount = mangaIds.length - movedCount
      const extraMessage = alreadyExistsCount > 0 ? ` (실패: ${alreadyExistsCount}개)` : ''

      toast.success(`${movedCount}개 작품을 이동했어요${extraMessage}`)
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraries })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryListBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryMangasBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItemsBase(fromLibraryId) })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItemsBase(toLibraryId) })
      exit()
    },
    onError: (error) => {
      toast.warning(error instanceof ProblemDetailsError ? error.problem.detail : '작품을 이동하지 못했어요')
    },
  })

  function getDisabledReason() {
    if (currentLibraryId == null) {
      return '현재 서재 정보를 확인할 수 없어요'
    }

    if (libraries.length === 0) {
      return '이동할 다른 내 서재가 없어요'
    }

    return undefined
  }

  return {
    dialogDescription: `${selectedCount}개 작품을 이동할 서재를 선택하세요`,
    dialogTitle: '서재로 이동',
    disabledReason: getDisabledReason(),
    emptyMessage: '이동할 수 있는 다른 서재가 없어요',
    icon: FolderInput,
    id: 'move',
    label: '이동',
    libraries,
    onSelectLibrary: (libraryId: number) => {
      if (!currentLibraryId) {
        return
      }

      mutation.mutate({
        fromLibraryId: currentLibraryId,
        toLibraryId: libraryId,
        mangaIds: Array.from(selectedIds),
      })
    },
    pending: mutation.isPending,
    type: 'library-select',
  }
}
