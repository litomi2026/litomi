'use client'

import { TurnstileInstance } from '@marsidev/react-turnstile'
import { sendGAEvent } from '@next/third-parties/google'
import { useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Info, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { FormEvent, MouseEvent, RefObject, useCallback, useRef, useState } from 'react'
import { toast } from 'sonner'

import IconLogo from '@/components/icons/LogoLitomi'
import TurnstileWidget from '@/components/TurnstileWidget'
import { LOGIN_ID_PATTERN, PASSWORD_PATTERN } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import { SearchParamKey } from '@/constants/storage'
import { env } from '@/env/client'
import useServerAction, { getFieldError, getFormField } from '@/hook/useServerAction'
import amplitude from '@/lib/amplitude/browser'
import { sanitizeRedirect } from '@/utils'

import signup from './action'

const { NEXT_PUBLIC_GA_ID } = env

type SignupData = {
  userId: number
  loginId: string
  name: string
  nickname: string
}

export default function SignupForm() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const formRef = useRef<HTMLFormElement>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const [turnstileToken, setTurnstileToken] = useState('')
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  const passwordConfirmInputRef = useRef<HTMLInputElement | null>(null)

  function clearLoginId() {
    const input = formRef.current?.elements.namedItem('login-id')
    if (!(input instanceof HTMLInputElement)) {
      return
    }

    input.value = ''
    input.focus()
  }

  function togglePasswordVisibility(e: MouseEvent<HTMLButtonElement>, inputRef: RefObject<HTMLInputElement | null>) {
    const input = inputRef.current
    if (!input) {
      return
    }

    const nextVisible = input.type === 'password'
    input.type = nextVisible ? 'text' : 'password'

    if (nextVisible) {
      e.currentTarget.setAttribute('aria-pressed', 'true')
    } else {
      e.currentTarget.removeAttribute('aria-pressed')
    }
    input.focus()
  }

  const handleSignupSuccess = useCallback(
    async ({ loginId, name, userId, nickname }: SignupData) => {
      toast.success(`${loginId} 계정으로 가입했어요`)

      if (userId) {
        amplitude.setUserId(userId)
        amplitude.track('signup', { loginId, nickname })
        if (NEXT_PUBLIC_GA_ID) {
          sendGAEvent('config', NEXT_PUBLIC_GA_ID, { user_id: userId })
          sendGAEvent('event', 'signup', { loginId, nickname })
        }
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

  const loginIdError = getFieldError(response, 'login-id')
  const passwordError = getFieldError(response, 'password')
  const passwordConfirmError = getFieldError(response, 'password-confirm')
  const nicknameError = getFieldError(response, 'nickname')
  const defaultLoginId = getFormField(response, 'login-id')
  const defaultPassword = getFormField(response, 'password')
  const defaultPasswordConfirm = getFormField(response, 'password-confirm')
  const defaultNickname = getFormField(response, 'nickname')

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    const formData = new FormData(e.currentTarget)
    const loginId = String(formData.get('login-id') ?? '')
    const password = String(formData.get('password') ?? '')
    const passwordConfirm = String(formData.get('password-confirm') ?? '')

    if (password !== passwordConfirm) {
      e.preventDefault()
      toast.warning('비밀번호가 일치하지 않아요')
    } else if (loginId === password) {
      e.preventDefault()
      toast.warning('아이디와 비밀번호를 다르게 입력해 주세요')
    }
  }

  return (
    <div className="grid gap-6 sm:gap-7">
      <Link className="w-fit mx-auto" href="/" prefetch={false}>
        <IconLogo className="w-9" priority />
      </Link>

      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">회원가입</h2>
        <p className="mt-2 text-sm text-zinc-400">몇 가지만 입력하고 시작해요</p>
      </div>

      <form action={dispatchAction} className="grid gap-5" onSubmit={handleSubmit} ref={formRef}>
        <div className="grid gap-4">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-zinc-300" htmlFor="login-id">
              아이디
            </label>
            <div className="relative group">
              <input
                aria-invalid={!!loginIdError}
                autoCapitalize="off"
                autoComplete="username"
                autoFocus
                className="w-full rounded-xl bg-white/4 border border-white/7 pl-3 pr-10 py-2.5 text-zinc-50 placeholder:text-zinc-500 transition
                  focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent
                  disabled:opacity-60 disabled:cursor-not-allowed
                  aria-invalid:border-red-600/50 aria-invalid:focus:ring-red-600/30"
                defaultValue={defaultLoginId}
                disabled={pending}
                id="login-id"
                maxLength={32}
                minLength={2}
                name="login-id"
                pattern={LOGIN_ID_PATTERN}
                placeholder="아이디"
                required
              />
              <button
                aria-label="아이디 지우기"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 bg-white/5 border border-white/7 text-zinc-400 hover:text-zinc-200 hover:bg-white/7 transition
                  opacity-0 pointer-events-none
                  group-has-[input:focus:not(:placeholder-shown)]:opacity-100 group-has-[input:focus:not(:placeholder-shown)]:pointer-events-auto
                  disabled:opacity-50 disabled:pointer-events-none"
                disabled={pending}
                onClick={clearLoginId}
                onMouseDown={(e) => e.preventDefault()}
                tabIndex={-1}
                type="button"
              >
                <X className="size-3.5" />
              </button>
            </div>
            {loginIdError ? (
              <p className="mt-1 text-xs text-red-400">{loginIdError}</p>
            ) : (
              <p className="mt-1 text-xs text-zinc-400">영문과 숫자, _ 를 사용해서 2자 이상 입력해 주세요</p>
            )}
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-zinc-300" htmlFor="password">
              비밀번호
            </label>
            <div className="relative group">
              <input
                aria-invalid={!!passwordError}
                autoCapitalize="off"
                autoComplete="new-password"
                className="w-full rounded-xl bg-white/4 border border-white/7 pl-3 pr-10 py-2.5 text-zinc-50 placeholder:text-zinc-500 transition
                  focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent
                  disabled:opacity-60 disabled:cursor-not-allowed
                  aria-invalid:border-red-600/50 aria-invalid:focus:ring-red-600/30"
                defaultValue={defaultPassword}
                disabled={pending}
                id="password"
                maxLength={64}
                minLength={8}
                name="password"
                pattern={PASSWORD_PATTERN}
                placeholder="비밀번호"
                ref={passwordInputRef}
                required
                type="password"
              />
              <button
                aria-label="비밀번호 표시"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 bg-white/5 border border-white/7 text-zinc-400 hover:text-zinc-200 hover:bg-white/7 transition
                  opacity-0 pointer-events-none
                  group-has-[input:focus:not(:placeholder-shown)]:opacity-100 group-has-[input:focus:not(:placeholder-shown)]:pointer-events-auto
                  aria-pressed:[&_.eye-icon]:hidden aria-pressed:[&_.eye-off-icon]:block
                  disabled:opacity-50 disabled:pointer-events-none"
                disabled={pending}
                onClick={(e) => togglePasswordVisibility(e, passwordInputRef)}
                onMouseDown={(e) => e.preventDefault()}
                tabIndex={-1}
                type="button"
              >
                <Eye className="eye-icon size-3.5" />
                <EyeOff className="eye-off-icon size-3.5 hidden" />
              </button>
            </div>
            {passwordError ? (
              <p className="mt-1 text-xs text-red-400">{passwordError}</p>
            ) : (
              <p className="mt-1 text-xs text-zinc-400">영문과 숫자를 포함해서 8자 이상 입력해 주세요</p>
            )}
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-zinc-300" htmlFor="password-confirm">
              비밀번호 확인
            </label>
            <div className="relative group">
              <input
                aria-invalid={!!passwordConfirmError}
                autoCapitalize="off"
                autoComplete="new-password"
                className="w-full rounded-xl bg-white/4 border border-white/7 pl-3 pr-10 py-2.5 text-zinc-50 placeholder:text-zinc-500 transition
                  focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent
                  disabled:opacity-60 disabled:cursor-not-allowed
                  aria-invalid:border-red-600/50 aria-invalid:focus:ring-red-600/30"
                defaultValue={defaultPasswordConfirm}
                disabled={pending}
                id="password-confirm"
                maxLength={64}
                minLength={8}
                name="password-confirm"
                placeholder="비밀번호 확인"
                ref={passwordConfirmInputRef}
                required
                type="password"
              />
              <button
                aria-label="비밀번호 표시"
                className="absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 bg-white/5 border border-white/7 text-zinc-400 hover:text-zinc-200 hover:bg-white/7 transition
                  opacity-0 pointer-events-none
                  group-has-[input:focus:not(:placeholder-shown)]:opacity-100 group-has-[input:focus:not(:placeholder-shown)]:pointer-events-auto
                  aria-pressed:[&_.eye-icon]:hidden aria-pressed:[&_.eye-off-icon]:block
                  disabled:opacity-50 disabled:pointer-events-none"
                disabled={pending}
                onClick={(e) => togglePasswordVisibility(e, passwordConfirmInputRef)}
                onMouseDown={(e) => e.preventDefault()}
                tabIndex={-1}
                type="button"
              >
                <Eye className="eye-icon size-3.5" />
                <EyeOff className="eye-off-icon size-3.5 hidden" />
              </button>
            </div>
            {passwordConfirmError ? (
              <p className="mt-1 text-xs text-red-400">{passwordConfirmError}</p>
            ) : (
              <p className="mt-1 text-xs text-zinc-400">비밀번호는 안전하게 암호화해서 저장돼요</p>
            )}
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-zinc-300" htmlFor="nickname">
              닉네임
            </label>
            <input
              aria-invalid={!!nicknameError}
              autoCapitalize="off"
              className="w-full rounded-xl bg-white/4 border border-white/7 px-3 py-2.5 text-zinc-50 placeholder:text-zinc-500 transition
                focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent
                disabled:opacity-60 disabled:cursor-not-allowed
                aria-invalid:border-red-600/50 aria-invalid:focus:ring-red-600/30"
              defaultValue={defaultNickname}
              disabled={pending}
              id="nickname"
              maxLength={32}
              minLength={2}
              name="nickname"
              placeholder="닉네임(선택)"
            />
            {nicknameError ? (
              <p className="mt-1 text-xs text-red-400">{nicknameError}</p>
            ) : (
              <p className="mt-1 text-xs text-zinc-400">2자 이상 입력해 주세요(비워두면 자동으로 생성돼요)</p>
            )}
          </div>
        </div>

        <div className="rounded-xl bg-white/4 border border-white/7 p-4">
          <div className="flex gap-3">
            <Info className="size-4 text-zinc-300/80 shrink-0 mt-0.5" />
            <div className="text-zinc-400">
              <p className="text-sm font-medium text-zinc-200 mb-1">자동 삭제 안내</p>
              <p className="text-xs">
                개인정보 보호를 위해 6개월 동안 활동이 없으면 계정이 자동으로 삭제돼요. 기간은 설정에서 바꿀 수 있어요.
              </p>
            </div>
          </div>
        </div>

        <button
          aria-disabled={pending || !turnstileToken}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/7 bg-white/5 px-4 py-3 text-sm font-medium text-white/90
            shadow-[inset_0_-2px_0_var(--color-brand),inset_0_1px_0_rgba(255,255,255,0.06)] transition
            hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15
            aria-disabled:opacity-50 aria-disabled:pointer-events-none"
          disabled={pending || !turnstileToken}
          type="submit"
        >
          {pending ? <Loader2 className="size-5 animate-spin" /> : null}
          {pending ? '회원가입 중...' : '회원가입'}
        </button>

        <TurnstileWidget
          onTokenChange={setTurnstileToken}
          options={{ action: 'signup' }}
          token={turnstileToken}
          turnstileRef={turnstileRef}
        />
      </form>

      <div className="grid gap-2 text-center text-xs text-zinc-400">
        <p className="flex flex-wrap gap-1 justify-center">
          가입하면
          <Link
            className="underline underline-offset-4 hover:text-zinc-200 transition"
            href="/doc/terms"
            prefetch={false}
          >
            이용약관
          </Link>
          과
          <Link
            className="underline underline-offset-4 hover:text-zinc-200 transition"
            href="/doc/privacy"
            prefetch={false}
          >
            개인정보처리방침
          </Link>
          에 동의하게 돼요
        </p>
        <p className="flex flex-wrap gap-1 justify-center">
          이미 계정이 있나요?
          <Link
            className="underline underline-offset-4 hover:text-zinc-200 transition"
            href="/auth/login"
            prefetch={false}
          >
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
