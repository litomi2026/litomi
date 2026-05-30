'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'

import { QueryKeys } from '@/lib/react-query/query-keys'

import type { BulkActionDescriptor, BulkTargetLibrary } from './bulkActionTypes'

import { bulkCopyToLibrary } from './api'
import { useLibrarySelection } from './librarySelection'

type Options = {
  libraries: BulkTargetLibrary[]
}

export default function useBulkCopyToLibraryAction({ libraries }: Options): BulkActionDescriptor {
  const queryClient = useQueryClient()
  const { exit, selectedCount, selectedIds } = useLibrarySelection()

  const mutation = useMutation({
    mutationFn: bulkCopyToLibrary,
    onSuccess: ({ copiedCount }, { mangaIds, toLibraryId }) => {
      const alreadyExistsCount = mangaIds.length - copiedCount
      const extraMessage = alreadyExistsCount > 0 ? ` (실패: ${alreadyExistsCount}개)` : ''

      toast.success(`${copiedCount}개 작품을 복사했어요${extraMessage}`)
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraries })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryListBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryMangasBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItemsBase(toLibraryId) })
      exit()
    },
  })

  return {
    dialogDescription: `${selectedCount}개 작품을 복사할 서재를 선택하세요`,
    dialogTitle: '서재에 복사',
    disabledReason: libraries.length === 0 ? '복사할 내 서재가 없어요' : undefined,
    emptyMessage: '복사할 수 있는 내 서재가 없어요',
    icon: Copy,
    id: 'copy',
    label: '복사',
    libraries,
    onSelectLibrary: (libraryId: number) => {
      mutation.mutate({
        toLibraryId: libraryId,
        mangaIds: Array.from(selectedIds),
      })
    },
    pending: mutation.isPending,
    type: 'library-select',
  }
}
