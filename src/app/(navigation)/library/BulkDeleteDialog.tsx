'use client'

import { Loader2, Trash2 } from 'lucide-react'

import Dialog from '@/components/ui/Dialog'
import DialogBody from '@/components/ui/DialogBody'
import DialogFooter from '@/components/ui/DialogFooter'
import DialogHeader from '@/components/ui/DialogHeader'

type Props = {
  ariaLabel: string
  confirmLabel: string
  description: string
  isPending: boolean
  onClose: () => void
  onConfirm: () => void
  open: boolean
  title: string
  warning: string
}

export default function BulkDeleteDialog({
  ariaLabel,
  confirmLabel,
  description,
  isPending,
  onClose,
  onConfirm,
  open,
  title,
  warning,
}: Readonly<Props>) {
  return (
    <Dialog ariaLabel={ariaLabel} className="sm:max-w-sm" onClose={onClose} open={open}>
      <DialogHeader onClose={onClose} title={title} />

      <DialogBody className="p-5">
        <div className="flex flex-col items-center text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-xl bg-zinc-800">
            <Trash2 className="size-6 shrink-0 text-red-500" />
          </div>
          <p className="mb-3 text-sm text-zinc-300">{description}</p>
          <p className="text-sm text-red-400">{warning}</p>
        </div>
      </DialogBody>

      <DialogFooter className="flex gap-3">
        <button
          className="flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-red-700 font-medium text-foreground transition hover:bg-red-600 disabled:opacity-50"
          disabled={isPending}
          onClick={onConfirm}
          type="button"
        >
          {isPending ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
          {confirmLabel}
        </button>
        <button
          className="h-10 flex-1 rounded-lg bg-zinc-800 font-medium text-zinc-300 transition hover:bg-zinc-700 disabled:opacity-50"
          disabled={isPending}
          onClick={onClose}
          type="button"
        >
          취소
        </button>
      </DialogFooter>
    </Dialog>
  )
}
