'use client'

import { useState } from 'react'

import IconPen from './icons/IconPen'
import Modal from './ui/Modal'

export default function PublishButton() {
  const [isOpened, setIsOpened] = useState(false)

  return (
    <>
      <div
        className="mx-auto my-4 hidden text-center text-lg leading-5 sm:block xl:mx-0 
        [&_button]:bg-zinc-700 [&_button]:hover:bg-zinc-600 [&_button]:active:bg-zinc-700
        [&_button]:rounded-full [&_button]:disabled:opacity-50 [&_button]:transition [&_button]:border-2 [&_button]:border-zinc-600"
      >
        <button className="p-3 2xl:hidden" onClick={() => setIsOpened(true)}>
          <IconPen className="w-6 text-white" />
        </button>
        <button className="w-11/12 p-4 hidden 2xl:block" onClick={() => setIsOpened(true)}>
          게시하기
        </button>
      </div>
      <Modal onClose={() => setIsOpened(false)} open={isOpened} showCloseButton showDragButton>
        <form className="bg-zinc-900 rounded-2xl px-4 pb-4 pt-5 border-2 border-zinc-800">
          <button disabled>게시하기</button>
          무슨 일이 일어나고 있나요?
        </form>
      </Modal>
    </>
  )
}
