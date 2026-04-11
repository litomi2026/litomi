'use client'

import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import type { ReadingHistorySource } from './common'

import BulkDeleteDialog from '../BulkDeleteDialog'
import useDeleteReadingHistoryMutation from './useDeleteReadingHistoryMutation'

type Props = {
  historyCount?: number
  source: ReadingHistorySource
}

export default function HistoryClearAllButton({ historyCount, source }: Props) {
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const deleteMutation = useDeleteReadingHistoryMutation({
    source,
    onSuccess: () => setIsDialogOpen(false),
  })

  const description =
    typeof historyCount === 'number' && historyCount > 0
      ? `감상 기록 ${historyCount}개를 모두 삭제할까요?`
      : '감상 기록을 모두 삭제할까요?'

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

  return (
    <>
      <button
        className="rounded-lg p-3 text-red-400 transition hover:bg-zinc-800 disabled:opacity-50"
        disabled={!historyCount || deleteMutation.isPending}
        onClick={() => setIsDialogOpen(true)}
        title={!historyCount ? '삭제할 감상 기록이 없어요' : '감상 기록 전체 삭제'}
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
        warning={warning}
      />
    </>
  )
}
