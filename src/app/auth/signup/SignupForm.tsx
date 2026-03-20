'use client'

import { TurnstileInstance } from '@marsidev/react-turnstile'
import { Eye, EyeOff, Info, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { SubmitEvent, useRef, useState } from 'react'
import { toast } from 'sonner'

import type { ProblemDetailsError } from '@/utils/react-query-error'

import IconLogo from '@/components/icons/LogoLitomi'
import TurnstileWidget from '@/components/TurnstileWidget'
import { LOGIN_ID_PATTERN, PASSWORD_PATTERN } from '@/constants/policy'

import {
  applySignupProblem,
  clearSignupInputValidity,
  clearSignupLoginId,
  clearSignupValidity,
  getSignupRequest,
  toggleSignupPasswordVisibility,
  validateSignupRequest,
} from './signup-form'
import useSignupMutation, { SIGNUP_LOCAL_ERROR_STATUSES } from './useSignupMutation'

export default function SignupForm() {
  const formRef = useRef<HTMLFormElement>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const [turnstileToken, setTurnstileToken] = useState('')

  const { mutate: submitSignup, isPending } = useSignupMutation({
    onError: (error) => {
      turnstileRef.current?.reset()
      setTurnstileToken('')

      const form = formRef.current
      clearSignupValidity(form)

      if (applySignupProblem(form, error.problem)) {
        return
      }

      if (!SIGNUP_LOCAL_ERROR_STATUSES.includes(error.status)) {
        return
      }

      toast.warning(getSignupErrorMessage(error))
    },
  })

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    clearSignupValidity(e.currentTarget)
    const request = getSignupRequest(e.currentTarget)

    if (!validateSignupRequest(e.currentTarget, request)) {
      return
    }

    submitSignup(request)
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

      <form
        className="grid gap-5"
        onInput={(e) => clearSignupInputValidity(e.currentTarget, e.target)}
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <div className="grid gap-4">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-zinc-300" htmlFor="login-id">
              아이디
            </label>
            <div className="relative group">
              <input
                autoCapitalize="off"
                autoComplete="username"
                autoFocus
                className="w-full rounded-xl bg-white/4 border border-white/7 pl-3 pr-10 py-2.5 text-zinc-50 placeholder:text-zinc-500 transition
                  focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent
                  disabled:opacity-60 disabled:cursor-not-allowed
                  invalid:border-red-600/50 invalid:focus:ring-red-600/30"
                disabled={isPending}
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
                disabled={isPending}
                onClick={() => clearSignupLoginId(formRef.current)}
                onMouseDown={(e) => e.preventDefault()}
                tabIndex={-1}
                type="button"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-400">영문과 숫자, _ 를 사용해서 2자 이상 입력해 주세요</p>
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-zinc-300" htmlFor="password">
              비밀번호
            </label>
            <div className="relative group">
              <input
                autoCapitalize="off"
                autoComplete="new-password"
                className="w-full rounded-xl bg-white/4 border border-white/7 pl-3 pr-10 py-2.5 text-zinc-50 placeholder:text-zinc-500 transition
                  focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent
                  disabled:opacity-60 disabled:cursor-not-allowed
                  invalid:border-red-600/50 invalid:focus:ring-red-600/30"
                disabled={isPending}
                id="password"
                maxLength={64}
                minLength={8}
                name="password"
                pattern={PASSWORD_PATTERN}
                placeholder="비밀번호"
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
                disabled={isPending}
                onClick={(e) => toggleSignupPasswordVisibility(formRef.current, 'password', e.currentTarget)}
                onMouseDown={(e) => e.preventDefault()}
                tabIndex={-1}
                type="button"
              >
                <Eye className="eye-icon size-3.5" />
                <EyeOff className="eye-off-icon size-3.5 hidden" />
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-400">영문과 숫자를 포함해서 8자 이상 입력해 주세요</p>
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-zinc-300" htmlFor="password-confirm">
              비밀번호 확인
            </label>
            <div className="relative group">
              <input
                autoCapitalize="off"
                autoComplete="new-password"
                className="w-full rounded-xl bg-white/4 border border-white/7 pl-3 pr-10 py-2.5 text-zinc-50 placeholder:text-zinc-500 transition
                  focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent
                  disabled:opacity-60 disabled:cursor-not-allowed
                  invalid:border-red-600/50 invalid:focus:ring-red-600/30"
                disabled={isPending}
                id="password-confirm"
                maxLength={64}
                minLength={8}
                name="password-confirm"
                placeholder="비밀번호 확인"
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
                disabled={isPending}
                onClick={(e) => toggleSignupPasswordVisibility(formRef.current, 'password-confirm', e.currentTarget)}
                onMouseDown={(e) => e.preventDefault()}
                tabIndex={-1}
                type="button"
              >
                <Eye className="eye-icon size-3.5" />
                <EyeOff className="eye-off-icon size-3.5 hidden" />
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-400">비밀번호는 안전하게 암호화해서 저장돼요</p>
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-zinc-300" htmlFor="nickname">
              닉네임
            </label>
            <input
              autoCapitalize="off"
              className="w-full rounded-xl bg-white/4 border border-white/7 px-3 py-2.5 text-zinc-50 placeholder:text-zinc-500 transition
                focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent
                disabled:opacity-60 disabled:cursor-not-allowed
                invalid:border-red-600/50 invalid:focus:ring-red-600/30"
              disabled={isPending}
              id="nickname"
              maxLength={32}
              minLength={2}
              name="nickname"
              placeholder="닉네임(선택)"
            />
            <p className="mt-1 text-xs text-zinc-400">2자 이상 입력해 주세요(비워두면 자동으로 생성돼요)</p>
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
          aria-disabled={isPending || !turnstileToken}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/7 bg-white/5 px-4 py-3 text-sm font-medium text-white/90
            shadow-[inset_0_-2px_0_var(--color-brand),inset_0_1px_0_rgba(255,255,255,0.06)] transition
            hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15
            aria-disabled:opacity-50 aria-disabled:pointer-events-none"
          disabled={isPending || !turnstileToken}
          type="submit"
        >
          {isPending ? <Loader2 className="size-5 animate-spin" /> : null}
          {isPending ? '회원가입 중...' : '회원가입'}
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

function getSignupErrorMessage(error: ProblemDetailsError) {
  return typeof error.problem.detail === 'string' ? error.problem.detail : '회원가입 중 오류가 발생했어요'
}
