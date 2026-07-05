'use client'

import { signalCurrentPasskeyUserDetails } from '@litomi/auth/passkey'
import type { DELETEV1MePasskeyResponse } from '@litomi/contracts'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@litomi/ui'
import { useMutation } from '@tanstack/react-query'
import { Loader2, Shield } from 'lucide-react'
import { toast } from 'sonner'

import { useRouter } from '@/i18n/navigation'
import type { ProblemDetailsError } from '@/utils/fetch-response'
import { deletePasskey } from './api'
import type { PasskeySignalData } from './common'

type Props = {
  credentialId: string
  id: number
  open: boolean
  onOpenChange: (open: boolean) => void
  passkeySignalData: PasskeySignalData
}

export default function PasskeyDeleteDialog({ credentialId, id, open, onOpenChange, passkeySignalData }: Props) {
  const router = useRouter()

  function handleClose() {
    onOpenChange(false)
  }

  const deleteMutation = useMutation<DELETEV1MePasskeyResponse, ProblemDetailsError, number>({
    mutationFn: deletePasskey,

    onSuccess: async () => {
      await signalCurrentPasskeyUserDetails({
        ...passkeySignalData,
        credentialIds: passkeySignalData.credentialIds.filter((id) => id !== credentialId),
      })

      toast.success('패스키가 삭제됐어요')
      onOpenChange(false)
      router.refresh()
    },
  })

  return (
    <Dialog ariaLabel="패스키 삭제" className="sm:max-w-sm" onClose={handleClose} open={open}>
      <DialogHeader onClose={handleClose} title="패스키 삭제" />

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
          disabled={deleteMutation.isPending}
          onClick={handleClose}
          type="button"
        >
          취소
        </button>
        <button
          className="flex flex-1 items-center justify-center h-10 px-4 rounded-lg bg-red-600 text-foreground font-medium disabled:opacity-70 relative"
          disabled={deleteMutation.isPending}
          onClick={() => deleteMutation.mutate(id)}
          type="button"
        >
          {deleteMutation.isPending ? <Loader2 className="size-6 animate-spin" /> : '삭제'}
        </button>
      </DialogFooter>
    </Dialog>
  )
}
