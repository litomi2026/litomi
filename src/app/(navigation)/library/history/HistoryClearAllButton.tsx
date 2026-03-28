'use client'

import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import BulkDeleteDialog from '../BulkDeleteDialog'
import useDeleteReadingHistoryMutation from './useDeleteReadingHistoryMutation'

type Props = {
  historyCount?: number
  userId: number
}

export default function HistoryClearAllButton({ historyCount, userId }: Readonly<Props>) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const deleteMutation = useDeleteReadingHistoryMutation({
    userId,
    onSuccess: () => {
      setIsDialogOpen(false)
    },
  })

  const description =
    typeof historyCount === 'number' && historyCount > 0
      ? `감상 기록 ${historyCount}개를 모두 삭제할까요?`
      : '감상 기록을 모두 삭제할까요?'

  return (
    <>
      <button
        className="rounded-lg p-3 text-red-400 transition hover:bg-zinc-800 disabled:opacity-50"
        disabled={historyCount === 0 || deleteMutation.isPending}
        onClick={() => setIsDialogOpen(true)}
        title={historyCount === 0 ? '삭제할 감상 기록이 없어요' : '감상 기록 전체 삭제'}
        type="button"
      >
        <Trash2 className="size-5" />
      </button>

      <BulkDeleteDialog
        ariaLabel="감상 기록 전체 삭제"
        confirmLabel="전체 삭제"
        description={description}
        isPending={deleteMutation.isPending}
        onClose={() => setIsDialogOpen(false)}
        onConfirm={() => deleteMutation.mutate({ mode: 'all' })}
        open={isDialogOpen}
        title="감상 기록 전체 삭제"
        warning="삭제한 감상 기록은 되돌릴 수 없고, 현재 브라우저의 이어읽기 캐시도 함께 정리돼요."
      />
    </>
  )
}
