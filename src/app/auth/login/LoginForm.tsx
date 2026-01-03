'use client'

import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { TurnstileInstance } from '@marsidev/react-turnstile'
import { sendGAEvent } from '@next/third-parties/google'
import { useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MouseEvent, useRef, useState } from 'react'
import { toast } from 'sonner'

import { migrateReadingHistory } from '@/app/manga/[id]/actions'
import IconLogo from '@/components/icons/LogoLitomi'
import PasskeyLoginButton from '@/components/PasskeyLoginButton'
import { clearMigratedHistory, getLocalReadingHistory } from '@/components/ReadingHistoryMigrator'
import TurnstileWidget from '@/components/TurnstileWidget'
import Toggle from '@/components/ui/Toggle'
import { LOGIN_ID_PATTERN, PASSWORD_PATTERN } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import { SearchParamKey } from '@/constants/storage'
import { env } from '@/env/client'
import useServerAction, { getFieldError, getFormField } from '@/hook/useServerAction'
import amplitude from '@/lib/amplitude/browser'
import { sanitizeRedirect } from '@/utils'
import { generatePKCEChallenge, PKCEChallenge } from '@/utils/pkce-browser'

import login from './action'
import TwoFactorVerification from './TwoFactorVerification'

const { NEXT_PUBLIC_GA_ID } = env

type TwoFactorData = {
  fingerprint: string
  remember: boolean
  authorizationCode: string
}

type User = {
  id: number
  loginId: string
  name: string
  lastLoginAt: Date | null
  lastLogoutAt: Date | null
}

export default function LoginForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const queryClient = useQueryClient()
  const [currentLoginId, setCurrentLoginId] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(null)
  const pkceChallengeRef = useRef<PKCEChallenge>(null)

  function resetId() {
    const loginIdInput = formRef.current?.elements.namedItem('login-id')
    if (!(loginIdInput instanceof HTMLInputElement)) {
      return
    }

    loginIdInput.value = ''
    setCurrentLoginId('')
    loginIdInput.focus()
  }

  function togglePasswordVisibility(e: MouseEvent<HTMLButtonElement>) {
    const input = passwordInputRef.current
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

  const [_, dispatchMigration] = useServerAction({
    action: migrateReadingHistory,
    shouldSetResponse: false,
    onSuccess: clearMigratedHistory,
  })

  async function handleLoginSuccess({ loginId, name, id, lastLoginAt, lastLogoutAt }: User) {
    toast.success(`${loginId} 계정으로 로그인했어요`)

    if (id) {
      amplitude.setUserId(id)
      amplitude.track('login', { loginId, lastLoginAt, lastLogoutAt })
      if (NEXT_PUBLIC_GA_ID) {
        sendGAEvent('config', NEXT_PUBLIC_GA_ID, { user_id: id })
        sendGAEvent('event', 'login', { loginId, lastLoginAt, lastLogoutAt })
      }
    }

    const localHistory = getLocalReadingHistory()

    if (localHistory.length > 0) {
      dispatchMigration(localHistory)
    }

    await queryClient.invalidateQueries({ queryKey: QueryKeys.me, type: 'all' })
    const params = new URLSearchParams(window.location.search)
    const redirect = params.get(SearchParamKey.REDIRECT)
    const sanitizedURL = sanitizeRedirect(redirect) || '/'
    const redirectURL = sanitizedURL.replace(/^\/@(?=\/|$|\?)/, `/@${name}`)
    router.replace(redirectURL)
  }

  const [response, dispatchAction, isPending] = useServerAction({
    action: login,
    onError: () => {
      turnstileRef.current?.reset()
      setTurnstileToken('')
    },
    onSuccess: (data, [formData]) => {
      if ('authorizationCode' in data) {
        setTwoFactorData({
          fingerprint: formData.get('fingerprint') as string,
          remember: formData.get('remember') === 'on',
          authorizationCode: data.authorizationCode,
        })
      } else {
        handleLoginSuccess(data)
      }
    },
  })

  const loginIdError = getFieldError(response, 'login-id')
  const passwordError = getFieldError(response, 'password')
  const defaultLoginId = getFormField(response, 'login-id')
  const defaultPassword = getFormField(response, 'password')
  const defaultRemember = getFormField(response, 'remember')

  async function dispatchLoginAction(formData: FormData) {
    const [pkceChallenge, fingerprint] = await Promise.all([
      generatePKCEChallenge(),
      FingerprintJS.load().then((fp) => fp.get()),
    ])

    pkceChallengeRef.current = pkceChallenge
    formData.append('code-challenge', pkceChallenge.codeChallenge)
    formData.append('fingerprint', fingerprint.visitorId)
    dispatchAction(formData)
  }

  const passkeyLoginId = currentLoginId || (typeof defaultLoginId === 'string' ? defaultLoginId : '')
  const isTwoFactorRequired = Boolean(twoFactorData && pkceChallengeRef.current)

  return (
    <div className="grid gap-6 sm:gap-7">
      <Link className="w-fit mx-auto" href="/" prefetch={false}>
        <IconLogo className="w-9" priority />
      </Link>

      {isTwoFactorRequired ? (
        <TwoFactorVerification
          onCancel={() => {
            setTwoFactorData(null)
            pkceChallengeRef.current = null
            turnstileRef.current?.reset()
            setTurnstileToken('')
          }}
          onSuccess={handleLoginSuccess}
          pkceChallenge={pkceChallengeRef.current!}
          twoFactorData={twoFactorData!}
        />
      ) : (
        <>
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">로그인</h2>
            <p className="mt-2 text-sm text-zinc-400">아이디와 비밀번호로 계속해요</p>
          </div>

          <form action={dispatchLoginAction} className="grid gap-5" ref={formRef}>
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
                    disabled={isPending}
                    id="login-id"
                    maxLength={32}
                    minLength={2}
                    name="login-id"
                    onChange={(e) => setCurrentLoginId(e.target.value)}
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
                    onClick={resetId}
                    onMouseDown={(e) => e.preventDefault()}
                    tabIndex={-1}
                    type="button"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
                {loginIdError && <p className="mt-1 text-xs text-red-400">{loginIdError}</p>}
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-zinc-300" htmlFor="password">
                  비밀번호
                </label>
                <div className="relative group">
                  <input
                    aria-invalid={!!passwordError}
                    autoComplete="current-password"
                    className="w-full rounded-xl bg-white/4 border border-white/7 pl-3 pr-10 py-2.5 text-zinc-50 placeholder:text-zinc-500 transition
                      focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent
                      disabled:opacity-60 disabled:cursor-not-allowed
                      aria-invalid:border-red-600/50 aria-invalid:focus:ring-red-600/30"
                    defaultValue={defaultPassword}
                    disabled={isPending}
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
                    disabled={isPending}
                    onClick={togglePasswordVisibility}
                    onMouseDown={(e) => e.preventDefault()}
                    tabIndex={-1}
                    type="button"
                  >
                    <Eye className="eye-icon size-3.5" />
                    <EyeOff className="eye-off-icon size-3.5 hidden" />
                  </button>
                </div>
                {passwordError && <p className="mt-1 text-xs text-red-400">{passwordError}</p>}
              </div>

              <div className="flex justify-end">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-zinc-400 select-none cursor-pointer" htmlFor="remember">
                    로그인 유지 (30일)
                  </label>
                  <Toggle
                    aria-label="로그인 유지"
                    className="w-10 bg-white/6 border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.28)] after:bg-white after:border-white/20 transition
                      peer-checked:bg-brand/65 peer-checked:border-transparent
                      peer-checked:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.18)]
                      peer-focus-visible:ring-white/20 peer-focus-visible:ring-offset-0"
                    defaultChecked={defaultRemember === 'on'}
                    disabled={isPending}
                    id="remember"
                    name="remember"
                  />
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
              {isPending ? '로그인 중...' : '로그인'}
            </button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/7" />
              </div>
              <div className="flex justify-center text-sm">
                <span className="relative z-10 px-4 bg-transparent text-zinc-500">또는</span>
              </div>
            </div>

            <PasskeyLoginButton
              disabled={isPending}
              loginId={passkeyLoginId}
              onSuccess={handleLoginSuccess}
              turnstileToken={turnstileToken}
            />

            <TurnstileWidget
              onTokenChange={setTurnstileToken}
              options={{ action: 'login' }}
              token={turnstileToken}
              turnstileRef={turnstileRef}
            />
          </form>

          <p className="text-center flex flex-wrap gap-1 justify-center text-xs text-zinc-400">
            처음이신가요?
            <Link
              className="underline underline-offset-4 hover:text-zinc-200 transition"
              href="/auth/signup"
              prefetch={false}
            >
              회원가입
            </Link>
          </p>
        </>
      )}
    </div>
  )
}
