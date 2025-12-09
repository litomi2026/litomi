'use client'

import { captureException } from '@sentry/nextjs'
import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import { useQueryClient } from '@tanstack/react-query'
import { SquarePen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, use, useEffect, useState } from 'react'
import { toast } from 'sonner'

import IconX from '@/components/icons/IconX'
import Modal from '@/components/ui/Modal'
import { QueryKeys } from '@/constants/query'
import useActionResponse, { getFieldError } from '@/hook/useActionResponse'

import editProfile from './action'

const formId = {
  name: 'name',
  nickname: 'nickname',
  imageURL: 'imageURL',
}

type Props = {
  mePromise: Promise<{
    loginId: string
    name: string
    nickname: string
    imageURL: string | null
  }>
}

export default function ProfileEditButton({ mePromise }: Readonly<Props>) {
  const me = use(mePromise)
  const [showModal, setShowModal] = useState(false)
  const queryClient = useQueryClient()
  const router = useRouter()
  const defaultProfileImageURL = me.imageURL ?? ''
  const [profileImageURL, setProfileImageURL] = useState(defaultProfileImageURL)

  const [response, dispatchAction, isPending] = useActionResponse({
    action: editProfile,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QueryKeys.me, exact: true })
      setShowModal(false)

      if (typeof data === 'string') {
        toast.success(data)
        return
      }

      toast.success(data.message)
      router.replace(data.location)
    },
  })

  const nameError = getFieldError(response, 'name')
  const nicknameError = getFieldError(response, 'nickname')
  const imageURLError = getFieldError(response, 'imageURL')

  function handleClose() {
    setShowModal(false)
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget)
    const name = formData.get('name')
    const nickname = formData.get('nickname')
    const imageURL = formData.get('imageURL')

    if (name === me.name && nickname === me.nickname && imageURL === (me.imageURL ?? '')) {
      e.preventDefault()
      toast.warning('수정할 정보를 입력해 주세요')
    }
  }

  return (
    <>
      <button
        className="flex items-center gap-3 text-sm font-semibold rounded-full p-2 transition whitespace-nowrap md:px-3 md:py-2
        hover:bg-zinc-800 active:bg-zinc-900 disabled:text-zinc-500 disabled:bg-zinc-800 disabled:pointer-events-none aria-hidden:hidden"
        onClick={() => setShowModal(true)}
      >
        <SquarePen className="size-5 shrink-0" />
        <span className="min-w-0 hidden md:block">프로필 수정</span>
      </button>
      <Modal
        className="w-full h-full md:w-auto md:h-auto"
        dragButtonClassName="hidden md:flex"
        onClose={handleClose}
        open={showModal}
        showDragButton
      >
        <form
          action={dispatchAction}
          className="w-full h-full flex flex-col bg-background md:bg-zinc-900 md:border-2 md:rounded-xl md:max-w-2xl"
          onSubmit={handleSubmit}
        >
          <header className="flex items-center justify-between p-4 border-b border-zinc-800 shrink-0">
            <div className="flex items-center gap-4">
              <button
                aria-label="닫기"
                className="p-2 rounded-full hover:bg-zinc-800 active:bg-zinc-900"
                onClick={handleClose}
                type="button"
              >
                <IconX className="w-5" />
              </button>
              <h2 className="text-lg font-semibold">프로필 수정</h2>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto">
            <div className="relative">
              <div className="h-32 bg-linear-to-b from-zinc-800 to-zinc-900" />
              <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-zinc-800">
                  <img
                    alt="프로필 이미지"
                    className="w-full h-full object-cover"
                    src={profileImageURL || me.imageURL || undefined}
                  />
                </div>
              </div>
            </div>
            <div className="grid gap-4 p-4 pt-16">
              <div className="grid gap-1">
                <label className="block text-sm font-medium text-zinc-400" htmlFor="loginId">
                  아이디
                </label>
                <input
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-500 cursor-not-allowed"
                  defaultValue={me.loginId}
                  disabled
                  id="loginId"
                  type="text"
                />
                <p className="text-xs text-zinc-600">변경할 수 없어요</p>
              </div>
              <div className="grid gap-1">
                <label className="block text-sm font-medium text-zinc-300" htmlFor={formId.name}>
                  이름
                </label>
                <input
                  aria-invalid={!!nameError}
                  autoCapitalize="off"
                  autoComplete="username"
                  className="w-full px-3 py-2 bg-zinc-800 border rounded-lg placeholder-zinc-500 focus:outline-none focus:ring-2 focus:border-transparent 
                      aria-invalid:border-red-500 aria-invalid:focus:ring-red-500 border-zinc-700 focus:ring-zinc-600"
                  defaultValue={me.name}
                  id={formId.name}
                  maxLength={32}
                  minLength={2}
                  name={formId.name}
                  placeholder="고유한 이름을 입력하세요"
                  type="text"
                />
                <p aria-invalid={!!nameError} className="text-xs text-zinc-500 aria-invalid:text-red-400">
                  {nameError || '이름으로 찾을 수 있어요 (2-32자)'}
                </p>
              </div>
              <div className="grid gap-1">
                <label className="block text-sm font-medium text-zinc-300" htmlFor={formId.nickname}>
                  닉네임
                </label>
                <input
                  aria-invalid={!!nicknameError}
                  autoCapitalize="off"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent 
                      aria-invalid:border-red-500 aria-invalid:focus:ring-red-500"
                  defaultValue={me.nickname}
                  id={formId.nickname}
                  maxLength={32}
                  minLength={2}
                  name={formId.nickname}
                  placeholder="사용할 닉네임을 입력하세요"
                  type="text"
                />
                <p aria-invalid={!!nicknameError} className="text-xs text-zinc-500 aria-invalid:text-red-400">
                  {nicknameError || '다른 사용자에게 표시되는 별명이에요 (2-32자)'}
                </p>
              </div>
              <div className="grid gap-1">
                <label className="block text-sm font-medium text-zinc-300" htmlFor={formId.imageURL}>
                  프로필 이미지 URL
                </label>
                <input
                  aria-invalid={!!imageURLError}
                  autoCapitalize="off"
                  autoComplete="photo"
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent 
                      aria-invalid:border-red-500 aria-invalid:focus:ring-red-500"
                  defaultValue={defaultProfileImageURL}
                  id={formId.imageURL}
                  maxLength={256}
                  minLength={8}
                  name={formId.imageURL}
                  onChange={(e) => setProfileImageURL(e.target.value)}
                  pattern="https?://.+"
                  placeholder="https://example.com/profile.jpg"
                  type="url"
                />
                <p aria-invalid={!!imageURLError} className="text-xs text-zinc-500 aria-invalid:text-red-400">
                  {imageURLError || '이미지는 정사각형 비율을 권장해요'}
                </p>
              </div>
              <p className="p-3 bg-zinc-800/50 rounded-lg text-xs text-zinc-400 leading-relaxed">
                클라우드 비용 절감을 위해 서버 트래픽을 제한하고 있어 변경 사항이 반영되는데 최대 1분이 소요될 수 있어요
              </p>
            </div>
          </div>
          <footer className="shrink-0 px-safe pb-safe border-t border-zinc-800 bg-zinc-900/50">
            <div className="flex items-center justify-between p-4">
              <button
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-300"
                onClick={() => setProfileImageURL(defaultProfileImageURL)}
                type="reset"
              >
                초기화
              </button>
              <button
                className="px-6 py-2 bg-white text-black font-medium text-sm rounded-lg hover:bg-zinc-200 active:bg-zinc-300 disabled:opacity-50"
                disabled={isPending}
                type="submit"
              >
                저장
              </button>
            </div>
          </footer>
        </form>
      </Modal>
    </>
  )
}

export function ProfileEditButtonError({ error, reset }: Readonly<ErrorBoundaryFallbackProps>) {
  useEffect(() => {
    captureException(error, { extra: { name: 'LogoutButtonError' } })
  }, [error])

  return (
    <button
      className="flex items-center gap-3 rounded-full p-3 text-red-500 transition hover:bg-red-500/20 active:scale-95"
      onClick={reset}
      type="reset"
    >
      <SquarePen className="size-5 transition group-disabled:scale-100" />
      <span className="min-w-0 hidden md:block">오류 (재시도)</span>
    </button>
  )
}

export function ProfileEditButtonSkeleton() {
  return <div className="w-9 h-9 animate-fade-in bg-zinc-800 rounded-full md:w-29" />
}
