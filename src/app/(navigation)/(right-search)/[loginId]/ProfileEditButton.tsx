'use client'

import { captureException } from '@sentry/nextjs'
import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import { useQueryClient } from '@tanstack/react-query'
import { useActionState, useEffect, useState } from 'react'
import { toast } from 'sonner'

import IconEdit from '@/components/icons/IconEdit'
import IconInfo from '@/components/icons/IconInfo'
import IconX from '@/components/icons/IconX'
import Modal from '@/components/ui/Modal'
import TooltipPopover from '@/components/ui/TooltipPopover'
import { QueryKeys } from '@/constants/query'
import useActionErrorEffect from '@/hook/useActionErrorEffect'
import useMeQuery from '@/query/useMeQuery'

import editProfile from './action'

const initialState = {} as Awaited<ReturnType<typeof editProfile>>

const formId = {
  nickname: 'nickname',
  imageURL: 'imageURL',
}

export default function ProfileEditButton() {
  const { data: me } = useMeQuery()
  const defaultProfileImageURL = me?.imageURL ?? ''
  const [{ error, success, status }, formAction, pending] = useActionState(editProfile, initialState)
  const [profileImageURL, setProfileImageURL] = useState(defaultProfileImageURL)
  const [showModal, setShowModal] = useState(false)
  const queryClient = useQueryClient()

  useEffect(() => {
    if (!pending && success) {
      toast.success('프로필 정보를 수정했어요.')
      queryClient.invalidateQueries({ queryKey: QueryKeys.me, exact: true })
    }
  }, [queryClient, success, pending])

  useActionErrorEffect({
    status,
    error,
    onError: (error) => toast.error(error),
  })

  return (
    <>
      <button
        aria-hidden={!me}
        className="flex items-center gap-3 text-sm font-semibold rounded-full p-2 transition hover:bg-zinc-800 active:bg-zinc-900 disabled:text-zinc-500 disabled:bg-zinc-800 disabled:pointer-events-none
          md:px-3 md:py-2 aria-hidden:hidden"
        onClick={() => setShowModal(true)}
      >
        <IconEdit className="w-5" />
        <span className="min-w-0 hidden md:block">프로필 수정</span>
      </button>
      {me && (
        <Modal
          className="w-full h-full md:w-auto md:h-auto"
          dragButtonClassName="hidden md:flex"
          onClose={() => setShowModal(false)}
          open={showModal}
          showDragButton
        >
          <form
            action={formAction}
            className="w-full h-full bg-background md:bg-zinc-900 md:border-2 md:rounded-xl
            [&_label]:block [&_label]:text-sm [&_label]:font-medium [&_label]:text-zinc-300 [&_label]:leading-7
            [&_input]:mt-1 [&_input]:w-full [&_input]:rounded-md [&_input]:bg-zinc-800 [&_input]:border [&_input]:border-zinc-600 
            [&_input]:px-3 [&_input]:py-2 [&_input]:placeholder-zinc-500 [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-zinc-500 
            [&_input]:focus:border-transparent [&_input]:disabled:bg-zinc-700 [&_input]:disabled:text-zinc-400 [&_input]:disabled:border-zinc-500 [&_input]:disabled:cursor-not-allowed"
          >
            {/* 상단바 */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-7">
                <button
                  aria-label="닫기"
                  className="p-2 transition rounded-full hover:bg-zinc-800 active:bg-zinc-900"
                  onClick={() => setShowModal(false)}
                  type="button"
                >
                  <IconX className="w-6" />
                </button>
                <h2 className="text-lg font-bold line-clamp-1" id="modal-header">
                  프로필 수정
                </h2>
              </div>
              <button
                className="px-4 py-1.5 bg-foreground text-background font-bold text-sm transition rounded-full hover:bg-zinc-300 active:bg-zinc-400"
                disabled={pending}
                type="submit"
              >
                저장
              </button>
            </div>
            {/* 배경 이미지 영역 */}
            <div className="relative bg-zinc-900 md:bg-zinc-700 h-32">
              <div className="sr-only">배경 이미지</div>
            </div>
            {/* 프로필 이미지 */}
            <div className="w-32 aspect-square mx-4 relative rounded-full border-4 -mt-16 overflow-hidden bg-zinc-700">
              <img alt="프로필 이미지" className="w-full h-full object-cover" src={profileImageURL} />
              <div className="sr-only">프로필 이미지</div>
            </div>
            {/* 내용 입력 폼 */}
            <div className="p-4 grid gap-4">
              <div>
                <label htmlFor={formId.imageURL}>프로필 이미지 주소</label>
                <input
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
              </div>
              <div>
                <label htmlFor="">아이디</label>
                <input defaultValue={me?.loginId ?? ''} disabled type="text" />
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <label htmlFor={formId.nickname}>닉네임</label>
                  <TooltipPopover className="flex" position="right" type="tooltip">
                    <IconInfo className="p-1.5 w-7 md:w-8 md:p-2" />
                    <div className="rounded-xl border-2 border-zinc-700 bg-background p-3 whitespace-nowrap text-sm">
                      <p>2자 이상 32자 이하로 입력해주세요.</p>
                    </div>
                  </TooltipPopover>
                </div>
                <input
                  defaultValue={me?.nickname ?? ''}
                  id={formId.nickname}
                  maxLength={32}
                  minLength={2}
                  name={formId.nickname}
                  placeholder="닉네임을 입력하세요"
                  type="text"
                />
              </div>
              <button type="reset">초기화</button>
              <p className="text-sm text-zinc-500 text-center max-w-prose mx-auto">
                클라우드 비용 절감을 위해 서버 트래픽을 제한하고 있어서 실시간 반영이 어려워요. 변경 사항이 실제로
                반영될 때까지 최대 1분 정도 걸릴 수 있어요
              </p>
            </div>
          </form>
        </Modal>
      )}
    </>
  )
}

export function ProfileEditButtonError({ error, reset }: ErrorBoundaryFallbackProps) {
  useEffect(() => {
    captureException(error, { extra: { name: 'LogoutButtonError' } })
  }, [error])

  return (
    <button
      className="flex items-center gap-3 rounded-full p-3 text-red-500 transition hover:bg-red-500/20 active:scale-95"
      onClick={reset}
      type="reset"
    >
      <IconEdit className="w-5 transition group-disabled:scale-100" />
      <span className="min-w-0 hidden md:block">오류 (재시도)</span>
    </button>
  )
}

export function ProfileEditButtonSkeleton() {
  return <div className="w-9 h-9 animate-fade-in bg-zinc-800 rounded-full md:w-29" />
}
