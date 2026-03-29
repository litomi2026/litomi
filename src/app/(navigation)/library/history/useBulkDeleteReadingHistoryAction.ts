'use client'

import { Trash2 } from 'lucide-react'

import type { BulkActionDescriptor } from '../bulkActionTypes'

import { useLibrarySelection } from '../librarySelection'
import useDeleteReadingHistoryMutation from './useDeleteReadingHistoryMutation'

type Options = {
  userId?: number
}

export default function useBulkDeleteReadingHistoryAction({ userId }: Readonly<Options>): BulkActionDescriptor {
  const { exit, selectedCount, selectedIds } = useLibrarySelection()

  const mutation = useDeleteReadingHistoryMutation({
    userId,
    onSuccess: exit,
  })

  return {
    ariaLabel: '감상 기록 삭제',
    confirmLabel: '삭제',
    description: `선택한 ${selectedCount}개 작품의 감상 기록을 삭제할까요?`,
    disabledReason: userId == null ? '로그인이 필요해요' : undefined,
    icon: Trash2,
    id: 'delete-history',
    label: '삭제',
    onConfirm: () => {
      mutation.mutate({
        mode: 'selected',
        mangaIds: Array.from(selectedIds),
      })
    },
    pending: mutation.isPending,
    title: '감상 기록 삭제',
    tone: 'danger',
    type: 'confirm',
    warning: '삭제한 감상 기록은 되돌릴 수 없고, 현재 브라우저의 이어읽기 캐시도 함께 정리돼요.',
  }
}
