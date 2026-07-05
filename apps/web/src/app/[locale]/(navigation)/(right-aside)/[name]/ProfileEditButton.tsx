'use client'

import { signalCurrentPasskeyUserDetails } from '@litomi/auth/passkey'
import { getSafeProfileImageURL } from '@litomi/std'
import { Dialog, DialogBody, DialogFooter, DialogHeader } from '@litomi/ui'
import { SquarePen } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type SubmitEvent, type SyntheticEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import { useRouter } from '@/i18n/navigation'

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
  me: EditableProfile
}

export default function ProfileEditButton({ me }: Props) {
  const [currentMe, setCurrentMe] = useState(me)
  const [showModal, setShowModal] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<ProfileFieldErrors>({})
  const defaultProfileImageURL = getSafeProfileImageURL(currentMe.imageURL ?? '')
  const [profileImageURL, setProfileImageURL] = useState(defaultProfileImageURL)
  const formRef = useRef<HTMLFormElement | null>(null)
  const t = useTranslations('Profile.edit')
  const tErrors = useTranslations('Errors')
  const router = useRouter()

  const editMutation = usePatchMyProfileMutation({
    onError: (error) => {
      clearProfileValidity(formRef.current)

      if (error.status === 401) {
        setFieldErrors({})
        setShowModal(false)
        router.refresh()
        return
      }

      const nextFieldErrors = getProfileProblemFieldErrors(error.problem, tErrors)
      setFieldErrors(nextFieldErrors)

      if (applyProfileProblem(formRef.current, error.problem, tErrors)) {
        return
      }
    },

    onSuccess: async (data, _variables, context) => {
      const previousProfile = context?.previousMe || currentMe
      const previousDisplayName = previousProfile.nickname || previousProfile.name
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
          name: previousProfile.loginId,
          userId: encodePasskeyUserId(previousProfile.id),
        })
      }

      toast.success(t('success'))

      if (data.name !== previousProfile.name) {
        router.replace(`/@${data.name}`)
      }
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
      toast.warning(t('emptyPatch'))
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
          'hover:bg-zinc-800 active:bg-zinc-900 disabled:text-zinc-500 disabled:bg-zinc-800 aria-hidden:hidden',
        )}
        onClick={() => setShowModal(true)}
        type="button"
      >
        <SquarePen className="size-5 shrink-0" />
        <span className="min-w-0 hidden md:block">{t('action')}</span>
      </button>
      <Dialog ariaLabel={t('action')} className="sm:max-w-2xl" onClose={handleClose} open={showModal}>
        <form
          className="flex flex-1 flex-col min-h-0"
          onInput={handleFormInput}
          onReset={handleReset}
          onSubmit={handleSubmit}
          ref={formRef}
        >
          <DialogHeader onClose={handleClose} title={t('action')} />
          <DialogBody className="p-0 sm:p-0">
            <div className="relative">
              <div className="h-32 bg-linear-to-b from-zinc-800 to-zinc-900" />
              <div className="absolute bottom-0 left-4 transform translate-y-1/2">
                <div className="w-24 h-24 rounded-full border-4 border-background overflow-hidden bg-zinc-800">
                  <img alt={t('imageAlt')} className="w-full h-full object-cover" src={profileImageURL || undefined} />
                </div>
              </div>
            </div>
            <div className="grid gap-4 p-4 pt-16">
              <div className="grid gap-1">
                <label className="block text-sm font-medium text-zinc-400" htmlFor="loginId">
                  {t('loginId')}
                </label>
                <input
                  className="w-full px-3 py-2 bg-zinc-900 border border-zinc-700 rounded-lg text-zinc-500 cursor-not-allowed"
                  defaultValue={me.loginId}
                  disabled
                  id="loginId"
                  type="text"
                />
                <p className="text-xs text-zinc-600">{t('immutable')}</p>
              </div>
              <div className="grid gap-1">
                <label className="block text-sm font-medium text-zinc-300" htmlFor={formId.name}>
                  {t('name')}
                </label>
                <input
                  aria-invalid={Boolean(fieldErrors.name)}
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
                  placeholder={t('namePlaceholder')}
                  type="text"
                />
                <p aria-invalid={Boolean(fieldErrors.name)} className="text-xs text-zinc-500 aria-invalid:text-red-400">
                  {fieldErrors.name || t('nameHelp')}
                </p>
              </div>
              <div className="grid gap-1">
                <label className="block text-sm font-medium text-zinc-300" htmlFor={formId.nickname}>
                  {t('nickname')}
                </label>
                <input
                  aria-invalid={Boolean(fieldErrors.nickname)}
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
                  placeholder={t('nicknamePlaceholder')}
                  type="text"
                />
                <p
                  aria-invalid={Boolean(fieldErrors.nickname)}
                  className="text-xs text-zinc-500 aria-invalid:text-red-400"
                >
                  {fieldErrors.nickname || t('nicknameHelp')}
                </p>
              </div>
              <div className="grid gap-1">
                <label className="block text-sm font-medium text-zinc-300" htmlFor={formId.imageURL}>
                  {t('imageURL')}
                </label>
                <input
                  aria-invalid={Boolean(fieldErrors.imageURL)}
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
                <p
                  aria-invalid={Boolean(fieldErrors.imageURL)}
                  className="text-xs text-zinc-500 aria-invalid:text-red-400"
                >
                  {fieldErrors.imageURL || t('imageURLHelp')}
                </p>
              </div>
              <p className="p-3 bg-zinc-800/50 rounded-lg text-xs text-zinc-400 leading-relaxed">
                {t('propagationNotice')}
              </p>
            </div>
          </DialogBody>
          <DialogFooter className="bg-zinc-900/50">
            <div className="flex items-center justify-between">
              <button className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-zinc-300" type="reset">
                {t('reset')}
              </button>
              <button
                className="px-6 py-2 bg-white text-black font-medium text-sm rounded-lg hover:bg-zinc-200 active:bg-zinc-300 disabled:opacity-50"
                disabled={isPending}
                type="submit"
              >
                {t('save')}
              </button>
            </div>
          </DialogFooter>
        </form>
      </Dialog>
    </>
  )
}
