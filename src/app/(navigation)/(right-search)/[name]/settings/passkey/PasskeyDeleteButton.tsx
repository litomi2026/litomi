'use client'
import { Loader2, Shield, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import Dialog from '@/components/ui/Dialog'
import DialogBody from '@/components/ui/DialogBody'
import DialogFooter from '@/components/ui/DialogFooter'
import DialogHeader from '@/components/ui/DialogHeader'
import useServerAction from '@/hook/useServerAction'

import { deleteCredential } from './action-delete'

type Props = {
  id: number
  className?: string
  onCancel?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export default function PasskeyDeleteButton({ id, className, onCancel, open, onOpenChange }: Readonly<Props>) {
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

  const [_, dispatchAction, isPending] = useServerAction({
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
          <Trash2 className="size-5 shrink-0" />
        </button>
      )}
      <Dialog ariaLabel="패스키 삭제" className="sm:max-w-sm" onClose={handleCancel} open={isOpen}>
        <DialogHeader onClose={handleCancel} title="패스키 삭제" />

        <DialogBody className="p-5">
          <div className="flex flex-col items-center text-center">
            <div className="mb-3 h-12 w-12 rounded-xl bg-zinc-800 flex items-center justify-center">
              <Shield className="size-6 shrink-0 text-red-500" />
            </div>
            <p className="text-sm text-zinc-500">
              이 패스키를 삭제하면 다시 등록해야 해요. 삭제된 패스키는 복구할 수 없어요.
            </p>
          </div>
        </DialogBody>

        <DialogFooter className="flex gap-3">
          <button
            className="flex-1 h-10 px-4 rounded-lg bg-zinc-800 text-zinc-300 font-medium disabled:opacity-50"
            disabled={isPending}
            onClick={handleCancel}
            type="button"
          >
            취소
          </button>
          <form action={dispatchAction} className="flex-1">
            <input name="credential-id" type="hidden" value={id} />
            <button
              className="flex items-center justify-center w-full h-10 px-4 rounded-lg bg-red-600 text-foreground font-medium disabled:opacity-70 relative"
              disabled={isPending}
              type="submit"
            >
              {isPending ? <Loader2 className="size-6 animate-spin" /> : '삭제'}
            </button>
          </form>
        </DialogFooter>
      </Dialog>
    </>
  )
}
