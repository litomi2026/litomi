'use client'

import hashaLogin from '@/app/auth/proxy/hasha/action'
import { useActionState, useState } from 'react'

import IconBookmark from './icons/IconBookmark'
import Modal from './ui/Modal'

const initialState = {} as Awaited<ReturnType<typeof hashaLogin>>

export default function BookmarkImportButton() {
  const [isOpened, setIsOpened] = useState(false)
  const [{ success, bookmarkResult }, formAction, pending] = useActionState(hashaLogin, initialState)

  return (
    <>
      <button
        className="text-sm flex items-center gap-2 font-semibold border-2 rounded-xl w-fit px-2 py-1 mx-auto"
        onClick={() => setIsOpened(true)}
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
        <form action={formAction} className="bg-zinc-900 rounded-2xl px-4 pb-4 pt-5 border-2">
          <h2 className="text-xl font-bold mb-4">북마크 불러오기</h2>
          <h2 className="text-center font-bold text-xl text-yellow-300 py-4">준비 중입니다</h2>

          <div className="grid gap-4">
            <input
              className="p-2 rounded border border-zinc-600 bg-zinc-800 text-white"
              name="username"
              placeholder="사용자 이름"
              required
            />
            <input
              className="p-2 rounded border border-zinc-600 bg-zinc-800 text-white"
              name="pwd"
              placeholder="비밀번호"
              required
              type="password"
            />
            <button
              className="bg-brand-gradient hover:bg-brand-600 text-background rounded px-4 py-2 transition"
              disabled
              type="submit"
            >
              하샤 로그인
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}
