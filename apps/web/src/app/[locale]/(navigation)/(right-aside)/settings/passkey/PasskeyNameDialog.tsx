'use client'

import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@litomi/ui'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import type React from 'react'
import { useEffect, useId, useState } from 'react'
import { toast } from 'sonner'

import { updatePasskeyName } from './api'

type Props = {
  id: number
  initialName: string
  onSaved?: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
  secondaryLabel?: string
  title?: string
}

export default function PasskeyNameDialog({
  id,
  initialName,
  onSaved,
  open,
  onOpenChange,
  secondaryLabel = '취소',
  title = '패스키 이름 변경',
}: Props) {
  const inputId = useId()
  const [name, setName] = useState(initialName)
  const trimmedName = name.trim()
  const isNameInvalid = trimmedName.length === 0 || trimmedName.length > 32

  const nameMutation = useMutation({
    mutationFn: (nextName: string) => updatePasskeyName(id, { name: nextName }),

    onSuccess: ({ message }) => {
      toast.success(message)
      onOpenChange(false)
      onSaved?.()
    },
  })

  function handleClose() {
    if (!nameMutation.isPending) {
      onOpenChange(false)
    }
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    if (isNameInvalid) {
      return
    }

    nameMutation.mutate(trimmedName)
  }

  useEffect(() => {
    if (open) {
      setName(initialName)
    }
  }, [initialName, open])

  return (
    <Dialog ariaLabel={title} className="sm:max-w-sm" onClose={handleClose} open={open}>
      <form className="flex flex-1 flex-col min-h-0" onSubmit={handleSubmit}>
        <DialogHeader onClose={handleClose} title={title} />
        <DialogBody className="flex flex-col gap-3 p-5">
          <label className="text-sm font-medium text-zinc-300" htmlFor={inputId}>
            패스키 이름
          </label>
          <input
            autoCapitalize="off"
            autoFocus
            className="w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 outline-none transition placeholder:text-zinc-500 focus:border-transparent focus:ring-2 focus:ring-zinc-600"
            id={inputId}
            maxLength={32}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="예: 내 iPhone, MacBook Touch ID"
            required
            type="text"
            value={name}
          />
          <p className="text-xs text-zinc-500">나중에 알아볼 수 있는 기기 이름을 붙여주세요. 최대 32자예요.</p>
        </DialogBody>
        <DialogFooter className="flex gap-3">
          <button
            className="flex-1 h-10 rounded-lg bg-zinc-800 px-4 text-sm font-medium text-zinc-300 disabled:opacity-50"
            disabled={nameMutation.isPending}
            onClick={handleClose}
            type="button"
          >
            {secondaryLabel}
          </button>
          <button
            className="flex flex-1 items-center justify-center h-10 rounded-lg bg-white px-4 text-sm font-medium text-black disabled:opacity-60"
            disabled={nameMutation.isPending || isNameInvalid}
            type="submit"
          >
            {nameMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : '저장'}
          </button>
        </DialogFooter>
      </form>
    </Dialog>
  )
}
