'use client'

import { Trash2 } from 'lucide-react'
import { useState } from 'react'

import type { PasskeySignalData } from './common'

import PasskeyDeleteDialog from './PasskeyDeleteDialog'

type Props = {
  credentialId: string
  id: number
  className?: string
  passkeySignalData: PasskeySignalData
}

export default function PasskeyDeleteButton({ credentialId, id, className, passkeySignalData }: Props) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button aria-label="패스키 삭제" className={className} onClick={() => setOpen(true)} type="button">
        <Trash2 className="size-5 shrink-0" />
      </button>
      <PasskeyDeleteDialog
        credentialId={credentialId}
        id={id}
        onOpenChange={setOpen}
        open={open}
        passkeySignalData={passkeySignalData}
      />
    </>
  )
}
