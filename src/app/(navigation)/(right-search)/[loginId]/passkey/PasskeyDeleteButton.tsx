'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'

import IconX from '@/components/icons/IconX'
import Modal from '@/components/ui/Modal'

import { deleteCredential } from './actions'
import { Passkey } from './common'

type Props = {
  passkey: Passkey
}

export default function PasskeyDeleteButton({ passkey }: Readonly<Props>) {
  const [isPending, startTransition] = useTransition()
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteCredential(passkey.id)

      if (!result.success) {
        toast.error('패스키 삭제에 실패했어요')
        return
      }

      toast.success('패스키가 삭제되었어요')
      setShowDeleteModal(false)
    })
  }

  return (
    <>
      <button
        aria-label="패스키 삭제"
        className="rounded-lg p-2 text-zinc-500 opacity-0 transition-all hover:bg-zinc-700 hover:text-red-400 group-hover:opacity-100"
        onClick={() => setShowDeleteModal(true)}
      >
        <IconX className="h-5 w-5" />
      </button>
      <Modal onClose={() => setShowDeleteModal(false)} open={showDeleteModal} showCloseButton>
        <div className="w-full max-w-sm rounded-lg bg-zinc-900 p-6">
          <h3 className="text-lg font-semibold mb-2">패스키를 삭제하시겠어요?</h3>
          <p className="text-sm text-zinc-400 mb-6">이 기기에서 패스키가 삭제되며, 다시 등록해야 사용할 수 있어요.</p>

          <div className="flex gap-3">
            <button
              className="flex-1 rounded-lg bg-zinc-800 px-4 py-2 font-medium transition hover:bg-zinc-700"
              disabled={isPending}
              onClick={() => setShowDeleteModal(false)}
            >
              취소
            </button>
            <button
              className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700 disabled:opacity-50"
              disabled={isPending}
              onClick={handleDelete}
            >
              {isPending ? '삭제 중...' : '삭제'}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}
