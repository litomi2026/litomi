'use client'

import { Trash2 } from 'lucide-react'

import type { BulkActionDescriptor } from '../bulkActionTypes'
import type { ReadingHistorySource } from './common'

import { useLibrarySelection } from '../librarySelection'
import useDeleteReadingHistoryMutation from './useDeleteReadingHistoryMutation'

type Options = {
  source: ReadingHistorySource
  userId?: number
}

export default function useBulkDeleteReadingHistoryAction({ source, userId }: Options): BulkActionDescriptor {
  const { exit, selectedCount, selectedIds } = useLibrarySelection()

  const mutation = useDeleteReadingHistoryMutation({
    source,
    onSuccess: exit,
  })

  const warning =
    source === 'local' ? (
      <>
        현재 브라우저에 저장된 감상 기록이 삭제되고, <br className="hidden sm:block" />
        삭제된 감상 기록은 되돌릴 수 없어요.
      </>
    ) : (
      <>
        현재 브라우저 및 서버에 저장된 감상 기록이 삭제되고, <br className="hidden sm:block" />
        삭제된 감상 기록은 되돌릴 수 없어요.
      </>
    )

  return {
    ariaLabel: '감상 기록 삭제',
    confirmLabel: '삭제',
    description: `선택한 ${selectedCount}개 작품의 감상 기록을 삭제할까요?`,
    disabledReason: source === 'server' && userId == null ? '로그인이 필요해요' : undefined,
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
    warning,
  }
}
