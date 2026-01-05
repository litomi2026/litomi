'use client'

import { Pen } from 'lucide-react'
import { useState } from 'react'

import Dialog from '@/components/ui/Dialog'
import DialogBody from '@/components/ui/DialogBody'
import DialogFooter from '@/components/ui/DialogFooter'
import DialogHeader from '@/components/ui/DialogHeader'

type Props = {
  className?: string
}

export default function PublishButton({ className = '' }: Readonly<Props>) {
  const [isOpened, setIsOpened] = useState(false)

  return (
    <>
      <div
        className={`text-center text-lg leading-5
        [&_button]:bg-zinc-700 [&_button]:hover:bg-zinc-600 [&_button]:active:bg-zinc-700
        [&_button]:rounded-full [&_button]:disabled:opacity-50 [&_button]:transition [&_button]:border-2 [&_button]:border-zinc-600 ${className}`}
      >
        <button className="p-3 2xl:hidden" onClick={() => setIsOpened(true)} type="button">
          <Pen aria-label="글쓰기" className="size-6 shrink-0 text-foreground" />
        </button>
        <button className="w-11/12 p-4 hidden 2xl:block" onClick={() => setIsOpened(true)} type="button">
          게시하기
        </button>
      </div>
      <Dialog ariaLabel="게시하기" className="sm:max-w-lg" onClose={() => setIsOpened(false)} open={isOpened}>
        <DialogHeader onClose={() => setIsOpened(false)} title="게시하기" />

        <DialogBody>
          <p className="text-zinc-400">무슨 일이 일어나고 있나요? (준비 중)</p>
        </DialogBody>

        <DialogFooter>
          <button aria-disabled className="w-full rounded-lg bg-zinc-800 p-3 font-semibold text-zinc-500" disabled>
            게시하기
          </button>
        </DialogFooter>
      </Dialog>
    </>
  )
}
