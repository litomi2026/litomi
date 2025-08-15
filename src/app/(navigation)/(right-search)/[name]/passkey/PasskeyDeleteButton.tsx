'use client'
import { useState } from 'react'
import { toast } from 'sonner'

import IconShield from '@/components/icons/IconShield'
import IconTrash from '@/components/icons/IconTrash'
import Loading from '@/components/ui/Loading'
import Modal from '@/components/ui/Modal'
import useActionResponse from '@/hook/useActionResponse'

import { deleteCredential } from './actions'

type Props = {
  credentialId: string
  username: string
  className?: string
  onCancel?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function PasskeyDeleteButton({
  credentialId,
  className,
  onCancel,
  open,
  onOpenChange,
}: Readonly<Props>) {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const isOpen = isControlled ? open : internalOpen

  const setIsOpen = (value: boolean) => {
    if (!isControlled) {
      setInternalOpen(value)
    }
    onOpenChange?.(value)
  }

  function handleCancel() {
    setIsOpen(false)
    onCancel?.()
  }

  const [_, dispatchAction, isPending] = useActionResponse({
    action: deleteCredential,
    onSuccess: (data) => {
      toast.success(data)
      setIsOpen(false)
    },
  })

  return (
    <>
      {!isControlled && (
        <button aria-label="패스키 삭제" className={className} onClick={() => setIsOpen(true)} type="button">
          <IconTrash className="w-5" />
        </button>
      )}
      <Modal
        className="w-[90vw] max-w-sm rounded-xl bg-zinc-900 border border-zinc-800"
        onClose={handleCancel}
        open={isOpen}
      >
        <div className="p-5 relative">
          {isPending && (
            <div className="absolute inset-0 bg-zinc-900/90 rounded-xl flex items-center justify-center z-10">
              <Loading className="w-5 text-zinc-400" />
            </div>
          )}
          <div className="flex flex-col items-center text-center mb-5">
            <div className="mb-3 h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center">
              <IconShield className="h-6 w-6 text-red-500" />
            </div>
            <h2 className="text-lg font-semibold text-zinc-100 mb-1">패스키 삭제</h2>
            <p className="text-sm text-zinc-500">
              이 패스키를 삭제하면 다시 등록해야 해요. 삭제된 패스키는 복구할 수 없어요.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              className="flex-1 h-10 px-4 rounded-lg bg-zinc-800 text-zinc-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isPending}
              onClick={handleCancel}
              type="button"
            >
              취소
            </button>
            <form action={dispatchAction} className="flex-1">
              <input name="credential-id" type="hidden" value={credentialId} />
              <button
                className="w-full h-10 px-4 rounded-lg bg-red-600 text-white font-medium disabled:opacity-70 disabled:cursor-not-allowed relative"
                disabled={isPending}
                type="submit"
              >
                {isPending ? <Loading className="h-4 w-4 mx-auto" /> : '삭제'}
              </button>
            </form>
          </div>
        </div>
      </Modal>
    </>
  )
}
