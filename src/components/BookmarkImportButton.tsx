'use client'

import { useState } from 'react'

import IconBookmark from './icons/IconBookmark'
import Modal from './ui/Modal'

export default function BookmarkImportButton() {
  const [isOpened, setIsOpened] = useState(false)

  function handleButtonClick() {
    setIsOpened(true)
  }

  return (
    <>
      <button
        className="flex items-center gap-2 text-sm font-semibold border-2 rounded-xl w-fit px-2.5 py-1.5 transition hover:bg-zinc-800 active:bg-zinc-900 disabled:text-zinc-500 disabled:bg-zinc-800 disabled:pointer-events-none"
        onClick={handleButtonClick}
        type="button"
      >
        <IconBookmark className="w-5" />
        북마크 불러오기
      </button>
      <Modal
        className="[@media(pointer:coarse)]:top-12"
        onClose={() => setIsOpened(false)}
        open={isOpened}
        showCloseButton
        showDragButton
      >
        <div className="grid gap-5 bg-zinc-900 min-w-3xs rounded-2xl px-4 pb-4 pt-5 border-2">
          <h2 className="text-xl text-center font-bold my-2">북마크 불러오기</h2>
          <p className="text-center text-zinc-400">북마크 불러오기 기능은 더 이상 지원되지 않습니다.</p>
        </div>
      </Modal>
    </>
  )
}

export function BookmarkImportButtonSkeleton() {
  return (
    <button className="flex items-center gap-2 text-sm font-semibold border-2 rounded-xl w-fit px-2.5 py-1.5 transition hover:bg-zinc-800 active:bg-zinc-900 disabled:text-zinc-500 disabled:bg-zinc-800 disabled:pointer-events-none">
      <IconBookmark className="w-5" />
      북마크 불러오기
    </button>
  )
}
