'use client'

import { Pen } from 'lucide-react'
import { useState } from 'react'

import Modal from '@/components/ui/Modal'

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
        <button className="p-3 2xl:hidden" onClick={() => setIsOpened(true)}>
          <Pen aria-label="글쓰기" className="w-6 text-foreground" />
        </button>
        <button className="w-11/12 p-4 hidden 2xl:block" onClick={() => setIsOpened(true)}>
          게시하기
        </button>
      </div>
      <Modal onClose={() => setIsOpened(false)} open={isOpened} showCloseButton showDragButton>
        <form className="bg-zinc-900 rounded-2xl px-4 pb-4 pt-5 border-2">
          <button disabled>게시하기</button>
          <p>무슨 일이 일어나고 있나요? (준비 중)</p>
        </form>
      </Modal>
    </>
  )
}
