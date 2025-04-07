'use client'

import hashaLogin from '@/app/auth/proxy/hasha/action'
import useMeQuery from '@/query/useMeQuery'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'

import IconBookmark from './icons/IconBookmark'
import LoginLink from './LoginLink'
import Modal from './ui/Modal'

const initialState = {} as Awaited<ReturnType<typeof hashaLogin>>

export default function BookmarkImportButton() {
  const [isOpened, setIsOpened] = useState(false)
  const [{ success, error, formData }, formAction, pending] = useActionState(hashaLogin, initialState)
  const { data: me } = useMeQuery()

  function handleButtonClick() {
    if (me) {
      setIsOpened(true)
    } else {
      toast.warning(
        <div className="flex gap-2 items-center">
          <div>로그인 해주세요.</div>
          <LoginLink>로그인하기</LoginLink>
        </div>,
      )
    }
  }

  useEffect(() => {
    if (error) {
      if (typeof error === 'string') {
        toast.error(error)
      } else {
        toast.error(error.username?.[0] ?? error.pwd?.[0])
      }
    }
  }, [error])

  useEffect(() => {
    if (success) {
      toast.success('북마크 불러오기 성공')
      setIsOpened(false)
    }
  }, [success])

  return (
    <>
      <button
        className="flex items-center gap-2 text-sm font-semibold border-2 rounded-lg w-fit px-2 py-1 transition hover:bg-zinc-800 active:bg-zinc-900 disabled:text-zinc-500 disabled:bg-zinc-800 disabled:pointer-events-none"
        disabled={pending}
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
        <form
          action={formAction}
          className="grid gap-5 bg-zinc-900 min-w-3xs rounded-2xl px-4 pb-4 pt-5 border-2
            [&_label]:block [&_label]:mb-1.5 [&_label]:text-sm [&_label]:font-medium [&_label]:text-zinc-300
            [&_input]:w-full [&_input]:rounded-md [&_input]:bg-zinc-800 [&_input]:border [&_input]:border-zinc-600 
            [&_input]:px-3 [&_input]:py-2 [&_input]:placeholder-zinc-500 [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-zinc-500 
            [&_input]:focus:border-transparent [&_input]:disabled:bg-zinc-700 [&_input]:disabled:border-zinc-500 [&_input]:disabled:cursor-not-allowed"
        >
          <h2 className="text-xl text-center font-bold my-2">북마크 불러오기</h2>
          <h2 className="text-center font-bold text-xl text-yellow-300">준비 중입니다</h2>
          <div className="grid gap-4">
            <p className="text-sm text-center text-zinc-400">
              북마크를 불러오기 위해서는 타사 사이트의 아이디와 비밀번호가 필요해요.
              <br />
              타사 사이트의 아이디와 비밀번호는{' '}
              <a
                className="underline"
                href="https://github.com/gwak2837/litomi/blob/main/src/app/auth/proxy/hasha/action.ts"
                target="_blank"
              >
                서버/데이터베이스에 저장되지 않아요.
              </a>
            </p>
            <div>
              <label htmlFor="username">아이디</label>
              <input
                className="p-2 rounded border border-zinc-600 bg-zinc-800 text-foreground"
                defaultValue={String(formData?.get('username') ?? '')}
                disabled={pending || !isOpened}
                id="username"
                name="username"
                placeholder="아이디"
                required
              />
            </div>
            <div>
              <label htmlFor="pwd">비밀번호</label>
              <input
                className="p-2 rounded border border-zinc-600 bg-zinc-800 text-foreground"
                defaultValue={String(formData?.get('pwd') ?? '')}
                disabled={pending || !isOpened}
                id="pwd"
                name="pwd"
                placeholder="비밀번호"
                required
                type="password"
              />
            </div>
            <button
              className="text-sm relative font-semibold bg-brand-gradient hover:brightness-110 active:brightness-100 text-background rounded-lg px-4 py-2 transition
                before:absolute before:inset-0 before:rounded-lg before:border-2 before:border-foreground/40"
              disabled={pending}
              type="submit"
            >
              hasha.in 로그인
            </button>
          </div>
        </form>
      </Modal>
    </>
  )
}

export function BookmarkImportButtonSkeleton() {
  return (
    <button className="flex items-center gap-2 text-sm font-semibold border-2 rounded-xl w-fit px-2 py-1">
      <IconBookmark className="w-5" />
      북마크 불러오기
    </button>
  )
}
