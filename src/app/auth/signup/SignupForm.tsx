'use client'

import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { FormEvent, useCallback } from 'react'
import { toast } from 'sonner'

import Loading from '@/components/ui/Loading'
import { loginIdPattern, passwordPattern } from '@/constants/pattern'
import { QueryKeys } from '@/constants/query'
import { SearchParamKey } from '@/constants/storage'
import useActionResponse, { getFieldError, getFormField } from '@/hook/useActionResponse'
import amplitude from '@/lib/amplitude/lazy'
import { resetMeQuery } from '@/query/useMeQuery'
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

  const handleSignupSuccess = useCallback(
    async ({ loginId, name, userId, nickname }: SignupData) => {
      toast.success(`${loginId} 계정으로 가입했어요`)

      if (userId) {
        amplitude.setUserId(userId)
        amplitude.track('signup', { loginId, nickname })
      }

      resetMeQuery()
      await queryClient.invalidateQueries({ queryKey: QueryKeys.me, type: 'all' })
      const params = new URLSearchParams(window.location.search)
      const redirect = params.get(SearchParamKey.REDIRECT)
      const sanitizedURL = sanitizeRedirect(redirect) || '/'
      const redirectURL = sanitizedURL.replace(/^\/@(?=\/|$|\?)/, `/@${name}`)
      router.replace(redirectURL)
    },
    [queryClient, router],
  )

  const [response, dispatchAction, pending] = useActionResponse({
    action: signup,
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
      toast.warning('아이디와 비밀번호를 다르게 입력해주세요')
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
            pattern={loginIdPattern}
            placeholder="아이디를 입력하세요"
            required
          />
          {loginIdError ? (
            <p className="mt-1 text-xs text-red-500">{loginIdError}</p>
          ) : (
            <p className="mt-1 text-xs text-zinc-400">
              알파벳, 숫자 - . _ ~ 만 사용하여 2자 이상의 아이디를 입력해주세요
            </p>
          )}
        </div>
        <div>
          <label htmlFor="password">
            비밀번호 <span className="text-red-500">*</span>
          </label>
          <input
            aria-invalid={!!passwordError}
            autoCapitalize="off"
            defaultValue={defaultPassword}
            disabled={pending}
            id="password"
            maxLength={64}
            minLength={8}
            name="password"
            pattern={passwordPattern}
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
          {passwordConfirmError && <p className="mt-1 text-xs text-red-500">{passwordConfirmError}</p>}
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
            <p className="mt-1 text-xs text-zinc-400">
              닉네임은 2자 이상 32자 이하로 입력해주세요. 나중에 변경할 수 있어요.
            </p>
          )}
        </div>
      </div>
      <button
        className="group border-2 border-brand-gradient font-medium rounded-xl disabled:border-zinc-500 disabled:pointer-events-none disabled:text-zinc-500 focus:outline-none focus:ring-3 focus:ring-zinc-500"
        disabled={pending}
        type="submit"
      >
        <div className="p-2 flex justify-center bg-zinc-900 cursor-pointer rounded-xl hover:bg-zinc-800 transition active:bg-zinc-900 group-disabled:bg-zinc-800 group-disabled:cursor-not-allowed">
          {pending ? <Loading className="text-zinc-500 w-12 p-2" /> : '회원가입'}
        </div>
      </button>
    </form>
  )
}

export function SignupFormSkeleton() {
  return <div className="h-[484px] rounded-xl bg-zinc-700 animate-fade-in" />
}
