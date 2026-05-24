'use client'

import { Pencil } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { twMerge } from 'tailwind-merge'

import PasskeyNameDialog from './PasskeyNameDialog'

type Props = {
  className?: string
  id: number
  name: string
}

export default function PasskeyRenameButton({ className, id, name }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className={twMerge('rounded-xl p-2 text-zinc-500 transition hover:bg-zinc-800 hover:text-zinc-300', className)}
        onClick={() => setOpen(true)}
        title="패스키 이름 변경"
        type="button"
      >
        <Pencil className="size-4 shrink-0" />
      </button>
      <PasskeyNameDialog
        id={id}
        initialName={name}
        onOpenChange={setOpen}
        onSaved={() => router.refresh()}
        open={open}
      />
    </>
  )
}
