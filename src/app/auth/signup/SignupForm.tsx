'use client'

import { TurnstileInstance } from '@marsidev/react-turnstile'
import { sendGAEvent } from '@next/third-parties/google'
import { useQueryClient } from '@tanstack/react-query'
import { Info } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { FormEvent, useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

import IconSpinner from '@/components/icons/IconSpinner'
import TurnstileWidget from '@/components/TurnstileWidget'
import { NEXT_PUBLIC_GA_ID } from '@/constants/env'
import { LOGIN_ID_PATTERN, PASSWORD_PATTERN } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import { SearchParamKey } from '@/constants/storage'
import useServerAction, { getFieldError, getFormField } from '@/hook/useServerAction'
import amplitude from '@/lib/amplitude/lazy'
import { sanitizeRedirect } from '@/utils'

import signup from './action'

type SignupData = {
  userId: number
  loginId: string
  name: string
  nickname: string
}

export default function SignupForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const turnstileRef = useRef<TurnstileInstance>(null)
  const [turnstileToken, setTurnstileToken] = useState('')

  const handleSignupSuccess = useCallback(
    async ({ loginId, name, userId, nickname }: SignupData) => {
      toast.success(`${loginId} 계정으로 가입했어요`)

      if (userId) {
        amplitude.setUserId(userId)
        amplitude.track('signup', { loginId, nickname })
        sendGAEvent('config', NEXT_PUBLIC_GA_ID, { user_id: userId })
        sendGAEvent('event', 'signup', { loginId, nickname })
      }

      await queryClient.invalidateQueries({ queryKey: QueryKeys.me, type: 'all' })
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get(SearchParamKey.REDIRECT)
      const sanitizedURL = sanitizeRedirect(redirect) || '/'
      const redirectURL = sanitizedURL.replace(/^\/@(?=\/|$|\?)/, `/@${name}`)
      router.replace(redirectURL)
    },
    [queryClient, router],
  )

  const [response, dispatchAction, pending] = useServerAction({
    action: signup,
    onError: () => {
      turnstileRef.current?.reset()
      setTurnstileToken('')
    },
    onSuccess: handleSignupSuccess,
  })

  const loginIdError = getFieldError(response, 'loginId')
  const passwordError = getFieldError(response, 'password')
  const passwordConfirmError = getFieldError(response, 'password-confirm')
  const nicknameError = getFieldError(response, 'nickname')
  const defaultLoginId = getFormField(response, 'loginId')
  const defaultPassword = getFormField(response, 'password')
  const defaultPasswordConfirm = getFormField(response, 'password-confirm')
  const defaultNickname = getFormField(response, 'nickname')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const formElement = e.currentTarget
    const loginId = formElement.loginId.value
    const password = formElement.password.value
    const passwordConfirm = formElement['password-confirm'].value

    if (password !== passwordConfirm) {
      e.preventDefault()
      toast.warning('비밀번호가 일치하지 않아요')
    } else if (loginId === password) {
      e.preventDefault()
      toast.warning('아이디와 비밀번호를 다르게 입력해 주세요')
    }
  }

  return (
    <form
      action={dispatchAction}
      className="grid gap-6 
      [&_label]:block [&_label]:text-sm [&_label]:md:text-base [&_label]:font-medium [&_label]:text-zinc-300 [&_label]:leading-7
      [&_input]:mt-1 [&_input]:w-full [&_input]:rounded-md [&_input]:bg-zinc-800 [&_input]:border [&_input]:border-zinc-600 
      [&_input]:px-3 [&_input]:py-2 [&_input]:placeholder-zinc-500 [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-zinc-500 
      [&_input]:focus:border-transparent [&_input]:disabled:bg-zinc-700 [&_input]:disabled:text-zinc-400 [&_input]:disabled:border-zinc-500 [&_input]:disabled:cursor-not-allowed
      [&_input]:aria-invalid:border-red-700 [&_input]:aria-invalid:focus:ring-red-700 [&_input]:aria-invalid:placeholder-red-700"
      onSubmit={handleSubmit}
    >
      <div className="grid gap-4">
        <div>
          <label htmlFor="loginId">
            아이디 <span className="text-red-500">*</span>
          </label>
          <input
            aria-invalid={!!loginIdError}
            autoCapitalize="off"
            autoFocus
            defaultValue={defaultLoginId}
            disabled={pending}
            id="loginId"
            maxLength={32}
            minLength={2}
            name="loginId"
            pattern={LOGIN_ID_PATTERN}
            placeholder="아이디를 입력하세요"
            required
          />
          {loginIdError ? (
            <p className="mt-1 text-xs text-red-500">{loginIdError}</p>
          ) : (
            <p className="mt-1 text-xs text-zinc-400">알파벳, 숫자, _ 만 사용하여 2자 이상의 아이디를 입력해주세요</p>
          )}
        </div>
        <div>
          <label htmlFor="password">
            비밀번호 <span className="text-red-500">*</span>
          </label>
          <input
            aria-invalid={!!passwordError}
            autoCapitalize="off"
            autoComplete="new-password"
            defaultValue={defaultPassword}
            disabled={pending}
            id="password"
            maxLength={64}
            minLength={8}
            name="password"
            pattern={PASSWORD_PATTERN}
            placeholder="비밀번호를 입력하세요"
            required
            type="password"
          />
          {passwordError ? (
            <p className="mt-1 text-xs text-red-500">{passwordError}</p>
          ) : (
            <p className="mt-1 text-xs text-zinc-400">
              알파벳, 숫자를 하나 이상 포함하여 8자 이상의 비밀번호를 입력해주세요
            </p>
          )}
        </div>
        <div>
          <label htmlFor="password-confirm">
            비밀번호 확인 <span className="text-red-500">*</span>
          </label>
          <input
            aria-invalid={!!passwordConfirmError}
            autoCapitalize="off"
            defaultValue={defaultPasswordConfirm}
            disabled={pending}
            id="password-confirm"
            maxLength={64}
            minLength={8}
            name="password-confirm"
            placeholder="비밀번호를 다시 입력하세요"
            required
            type="password"
          />
          {passwordConfirmError ? (
            <p className="mt-1 text-xs text-red-500">{passwordConfirmError}</p>
          ) : (
            <p className="mt-1 text-xs text-zinc-400">비밀번호는 bcrypt 해싱으로 암호화하여 안전하게 처리하고 있어요</p>
          )}
        </div>
        <div>
          <label htmlFor="nickname">닉네임</label>
          <input
            aria-invalid={!!nicknameError}
            autoCapitalize="off"
            defaultValue={defaultNickname}
            disabled={pending}
            id="nickname"
            maxLength={32}
            minLength={2}
            name="nickname"
            placeholder="닉네임을 입력하세요"
          />
          {nicknameError ? (
            <p className="mt-1 text-xs text-red-500">{nicknameError}</p>
          ) : (
            <p className="mt-1 text-xs text-zinc-400">닉네임은 2자 이상 입력해주세요</p>
          )}
        </div>
      </div>
      <div className="rounded-lg bg-zinc-800/50 border border-zinc-700 p-4">
        <div className="flex gap-3">
          <Info className="size-4 text-zinc-400 shrink-0 mt-0.5" />
          <div className="text-zinc-400">
            <p className="text-sm font-medium text-zinc-300 mb-1">계정 자동 삭제 안내</p>
            <p className="text-xs">
              개인정보 보호를 위해 1년 동안 활동이 없는 계정은 자동으로 삭제돼요. 자동 삭제 기간은 회원 가입 후 설정
              페이지에서 변경할 수 있어요.
            </p>
          </div>
        </div>
      </div>
      <button
        className="group border-2 border-brand-gradient font-medium rounded-xl disabled:border-zinc-500 disabled:pointer-events-none disabled:text-zinc-500 focus:outline-none focus:ring-3 focus:ring-zinc-500"
        disabled={pending || !turnstileToken}
        type="submit"
      >
        <div className="p-2 flex justify-center bg-zinc-900 cursor-pointer rounded-xl hover:bg-zinc-800 transition active:bg-zinc-900 group-disabled:bg-zinc-800 group-disabled:cursor-not-allowed">
          {pending ? <IconSpinner className="text-zinc-500 size-6 p-0.5" /> : '회원가입'}
        </div>
      </button>
      <TurnstileWidget
        onTokenChange={setTurnstileToken}
        options={{ action: 'signup' }}
        token={turnstileToken}
        turnstileRef={turnstileRef}
      />
    </form>
  )
}
