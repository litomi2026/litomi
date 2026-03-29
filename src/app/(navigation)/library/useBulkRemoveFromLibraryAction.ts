'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { QueryKeys } from '@/constants/query'
import { ProblemDetailsError } from '@/utils/react-query-error'

import type { BulkActionDescriptor } from './bulkActionTypes'

import { bulkRemoveFromLibrary } from './api'
import { useLibrarySelection } from './librarySelection'

type Options = {
  libraryId?: number
}

export default function useBulkRemoveFromLibraryAction({ libraryId }: Readonly<Options>): BulkActionDescriptor {
  const queryClient = useQueryClient()
  const { exit, selectedCount, selectedIds } = useLibrarySelection()

  const mutation = useMutation({
    mutationFn: bulkRemoveFromLibrary,
    onSuccess: ({ removedCount }, variables) => {
      if (removedCount === 0) {
        toast.warning('이미 제거된 작품이에요')
      } else {
        toast.success(`${removedCount}개 작품을 제거했어요`)
      }

      queryClient.invalidateQueries({ queryKey: QueryKeys.libraries })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryListBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.infiniteLibraryMangasBase })
      queryClient.invalidateQueries({ queryKey: QueryKeys.libraryItems(variables.libraryId) })
      exit()
    },
    onError: (error) => {
      toast.warning(error instanceof ProblemDetailsError ? error.problem.detail : '서재에서 작품을 제거하지 못했어요')
    },
  })

  return {
    ariaLabel: '서재에서 제거',
    confirmLabel: '제거',
    description: `선택한 ${selectedCount}개 작품을 이 서재에서 제거할까요?`,
    disabledReason: libraryId == null ? '현재 서재 정보를 확인할 수 없어요' : undefined,
    icon: Trash2,
    id: 'remove',
    label: '제거',
    onConfirm: () => {
      if (!libraryId) {
        return
      }

      mutation.mutate({
        libraryId,
        mangaIds: Array.from(selectedIds),
      })
    },
    pending: mutation.isPending,
    title: '서재에서 제거',
    tone: 'danger',
    type: 'confirm',
    warning: '제거한 작품은 현재 서재에서만 사라지고 작품 자체는 삭제되지 않아요.',
  }
}
