'use client'

import { signalCurrentPasskeyUserDetails } from '@litomi/auth/passkey'
import { getSafeProfileImageURL } from '@litomi/std'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@litomi/ui'
import { captureException } from '@sentry/nextjs'
import { ErrorBoundaryFallbackProps } from '@suspensive/react'
import { SquarePen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { SubmitEvent, SyntheticEvent, use, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import {
  applyProfileProblem,
  buildProfileEditPatch,
  clearProfileInputValidity,
  clearProfileValidity,
  type EditableProfile,
  encodePasskeyUserId,
  getProfileProblemFieldErrors,
  type ProfileFieldErrors,
} from './profile-edit-form'
import usePatchMyProfileMutation from './usePatchMyProfileMutation'

const formId = {
  name: 'name',
  nickname: 'nickname',
  imageURL: 'imageURL',
}

type Props = {
  mePromise: Promise<EditableProfile>
}

export default function ProfileEditButton({ mePromise }: Props) {
  const me = use(mePromise)
  const [currentMe, setCurrentMe] = useState(me)
  const [showModal, setShowModal] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({})
  const formRef = useRef<HTMLFormElement | null>(null)
  const router = useRouter()
  const defaultProfileImageURL = getSafeProfileImageURL(currentMe.imageURL ?? '')
  const [profileImageURL, setProfileImageURL] = useState(defaultProfileImageURL)

  const editMutation = usePatchMyProfileMutation({
    onError: (error) => {
      clearProfileValidity(formRef.current)

      if (error.status === 401) {
        setFieldErrors({})
        setShowModal(false)
        router.refresh()
        return
      }

      const nextFieldErrors = getProfileProblemFieldErrors(error.problem)
      setFieldErrors(nextFieldErrors)

      if (applyProfileProblem(formRef.current, error.problem)) {
        return
      }
    },

    onSuccess: async (data) => {
      const previousDisplayName = currentMe.nickname || currentMe.name
      const nextDisplayName = data.nickname || data.name

      setCurrentMe((previous) => ({
        ...previous,
        name: data.name,
        nickname: data.nickname,
        imageURL: data.imageURL,
      }))

      setFieldErrors({})
      setShowModal(false)

      if (previousDisplayName !== nextDisplayName) {
        await signalCurrentPasskeyUserDetails({
          displayName: nextDisplayName,
          name: currentMe.loginId,
          userId: encodePasskeyUserId(currentMe.id),
        })
      }

      toast.success(data.message)

      if (data.name !== currentMe.name) {
        router.replace(`/@${data.name}`)
        return
      }

      router.refresh()
    },
  })

  const isPending = editMutation.isPending

  function handleClose() {
    setShowModal(false)
  }

  function handleFormInput(e: SyntheticEvent<HTMLFormElement>) {
    clearProfileInputValidity(e.target)

    const target = e.target

    if (!(target instanceof HTMLInputElement)) {
      return
    }

    setFieldErrors((previous) => {
      if (!(target.name in previous)) {
        return previous
      }

      return {
        ...previous,
        [target.name]: undefined,
      }
    })
  }

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    clearProfileValidity(formRef.current)
    setFieldErrors({})

    if (!e.currentTarget.reportValidity()) {
      return
    }

    const formData = new FormData(e.currentTarget)
    const patch = buildProfileEditPatch(currentMe, formData)

    if (!patch) {
      toast.warning('수정할 정보를 입력해 주세요')
      return
    }

    editMutation.mutate(patch)
  }

  function handleReset() {
    setFieldErrors({})
    setProfileImageURL(defaultProfileImageURL)
    clearProfileValidity(formRef.current)
  }

  // NOTE: me가 변경될 때마다 currentMe를 갱신해요
  useEffect(() => {
    setCurrentMe(me)
  }, [me])

  // NOTE: 모달이 닫힐 때마다 폼을 초기화해요
  useEffect(() => {
    if (!showModal) {
      formRef.current?.reset()
      setProfileImageURL(defaultProfileImageURL)
      setFieldErrors({})
      clearProfileValidity(formRef.current)
    }
  }, [defaultProfileImageURL, showModal])

  return (
    <>
      <button
        className={twMerge(
          'flex items-center gap-3 text-sm font-semibold rounded-full p-2 transition whitespace-nowrap md:px-3 md:py-2',
          'hover:bg-zinc-800 active:bg-zinc-900 disabled:text-zinc-500 disabled:bg-zinc-800 disabled:pointer-events-none aria-hidden:hidden',
        )}
        onClick={() => setShowModal(true)}
        type="button"
      >
        <SquarePen className="size-5 shrink-0" />
        <span className="min-w-0 hidden md:block">프로필 수정</span>
      </button>
      <Dialog ariaLabel="프로필 수정" className="sm:max-w-2xl" onClose={handleClose} open={showModal}>
        <form
          className="flex flex-1 flex-col min-h-0"
          onInput={handleFormInput}
          onReset={handleReset}
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <DialogHeader onClose={handleClose} title="프로필 수정" />
          <DialogBody className="p-0 sm:p-0">
            <div className="relative">
              <div className="h-32 bg-linear-to-b from-zinc-800 to-zinc-900" />
              <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-zinc-800">
                  <img alt="프로필 이미지" className="w-full h-full object-cover" src={profileImageURL || undefined} />
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
                  aria-invalid={!!fieldErrors.name}
                  autoCapitalize="off"
                  autoComplete="username"
                  className={twMerge(
                    'w-full px-3 py-2 bg-zinc-800 border rounded-lg placeholder-zinc-500 focus:outline-none focus:ring-2 focus:border-transparent',
                    'aria-invalid:border-red-500 aria-invalid:focus:ring-red-500 border-zinc-700 focus:ring-zinc-600',
                  )}
                  defaultValue={currentMe.name}
                  id={formId.name}
                  maxLength={32}
                  minLength={2}
                  name={formId.name}
                  placeholder="고유한 이름을 입력하세요"
                  type="text"
                />
                <p aria-invalid={!!fieldErrors.name} className="text-xs text-zinc-500 aria-invalid:text-red-400">
                  {fieldErrors.name || '이름으로 찾을 수 있어요 (2-32자)'}
                </p>
              </div>
              <div className="grid gap-1">
                <label className="block text-sm font-medium text-zinc-300" htmlFor={formId.nickname}>
                  닉네임
                </label>
                <input
                  aria-invalid={!!fieldErrors.nickname}
                  autoCapitalize="off"
                  className={twMerge(
                    'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent',
                    'aria-invalid:border-red-500 aria-invalid:focus:ring-red-500',
                  )}
                  defaultValue={currentMe.nickname}
                  id={formId.nickname}
                  maxLength={32}
                  minLength={2}
                  name={formId.nickname}
                  placeholder="사용할 닉네임을 입력하세요"
                  type="text"
                />
                <p aria-invalid={!!fieldErrors.nickname} className="text-xs text-zinc-500 aria-invalid:text-red-400">
                  {fieldErrors.nickname || '다른 사용자에게 표시되는 별명이에요 (2-32자)'}
                </p>
              </div>
              <div className="grid gap-1">
                <label className="block text-sm font-medium text-zinc-300" htmlFor={formId.imageURL}>
                  프로필 이미지 URL
                </label>
                <input
                  aria-invalid={!!fieldErrors.imageURL}
                  autoCapitalize="off"
                  autoComplete="photo"
                  className={twMerge(
                    'w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 focus:border-transparent',
                    'aria-invalid:border-red-500 aria-invalid:focus:ring-red-500',
                  )}
                  defaultValue={defaultProfileImageURL}
                  id={formId.imageURL}
                  maxLength={256}
                  minLength={8}
                  name={formId.imageURL}
                  onChange={(e) => setProfileImageURL(getSafeProfileImageURL(e.currentTarget.value))}
                  pattern="https?://.+"
                  placeholder="https://example.com/profile.jpg"
                  type="url"
                />
                <p aria-invalid={!!fieldErrors.imageURL} className="text-xs text-zinc-500 aria-invalid:text-red-400">
                  {fieldErrors.imageURL || '이미지는 정사각형 비율을 권장해요'}
                </p>
              </div>
              <p className="p-3 bg-zinc-800/50 rounded-lg text-xs text-zinc-400 leading-relaxed">
                클라우드 비용 절감을 위해 서버 트래픽을 제한하고 있어 변경 사항이 반영되는데 최대 1분이 소요될 수 있어요
              </p>
            </div>
          </DialogBody>
          <DialogFooter className="bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <button className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-300" type="reset">
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
          </DialogFooter>
        </form>
      </Dialog>
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
