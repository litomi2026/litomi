'use client'

import type { POSTV1AuthLoginAuthenticatedResponse, POSTV1AuthPasskeyVerifyResponse } from '@litomi/contracts'

import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { generatePKCEChallenge, PKCEChallenge } from '@litomi/auth/pkce-browser'
import { LOGIN_ID_PATTERN, PASSWORD_PATTERN } from '@litomi/domain/auth/policy'
import { Toggle } from '@litomi/ui'
import { TurnstileInstance } from '@marsidev/react-turnstile'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, Loader2, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MouseEvent, SubmitEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import type { ProblemDetailsError } from '@/utils/api-request'

import IconLogo from '@/components/icons/LogoLitomi'
import PasskeyLoginButton from '@/components/PasskeyLoginButton'
import TurnstileWidget from '@/components/TurnstileWidget'
import { identify, track } from '@/lib/analytics/browser'
import { QueryKeys } from '@/lib/react-query/query-keys'
import { getMeQueryFetchOptions } from '@/query/useMeQuery'
import { SearchParamKey } from '@/storage'
import { sanitizeRedirect } from '@/utils'
import { isAdultVerified } from '@/utils/adult-verification'
import { getLocalReadingHistoryArray, removeLocalReadingHistory } from '@/utils/reading-history-index'

import { importReadingHistory, login } from './api'
import SignupLink from './SignupLink'
import TwoFactorVerification from './TwoFactorVerification'
import { applyLoginProblem, clearLoginId, clearLoginValidity } from './util'

type TwoFactorData = {
  fingerprint: string
  remember: boolean
  authorizationCode: string
}

const LOGIN_LOCAL_ERROR_STATUSES = [400, 401]

type User = POSTV1AuthLoginAuthenticatedResponse | POSTV1AuthPasskeyVerifyResponse

export default function LoginForm() {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement>(null)
  const passwordInputRef = useRef<HTMLInputElement | null>(null)
  const turnstileRef = useRef<TurnstileInstance>(null)
  const queryClient = useQueryClient()
  const [hasTurnstileToken, setHasTurnstileToken] = useState(false)
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(null)
  const [pkceChallenge, setPkceChallenge] = useState<PKCEChallenge | null>(null)

  const { mutate: submitLogin, isPending } = useMutation({
    mutationFn: login,
    onError: (error: ProblemDetailsError) => {
      resetTurnstile()
      clearLoginValidity(formRef.current)

      window.requestAnimationFrame(() => {
        const form = formRef.current

        if (applyLoginProblem(form, error.problem)) {
          return
        }

        if (!LOGIN_LOCAL_ERROR_STATUSES.includes(error.status)) {
          return
        }

        toast.warning(error.problem.detail ?? '로그인할 수 없어요')
      })
    },
    onSuccess: (data, variables) => {
      if (data.nextStep === 'two_factor_required') {
        setTwoFactorData({
          fingerprint: variables.fingerprint,
          remember: variables.remember,
          authorizationCode: data.authorizationCode,
        })
        return
      }

      setPkceChallenge(null)
      handleLoginSuccess(data)
    },
    meta: { suppressGlobalErrorToastForStatuses: LOGIN_LOCAL_ERROR_STATUSES },
  })

  const { mutateAsync: migrateReadingHistory } = useMutation({
    mutationFn: importReadingHistory,
    onSuccess: ({ synced }) => {
      if (synced) {
        removeLocalReadingHistory()
        queryClient.invalidateQueries({ queryKey: QueryKeys.readingHistoryBase })
        queryClient.invalidateQueries({ queryKey: QueryKeys.localReadingHistorySummary })
      }
    },
  })

  async function getTurnstileToken() {
    const existingToken = turnstileRef.current?.getResponse()

    if (existingToken) {
      return existingToken
    }

    try {
      return (await turnstileRef.current?.getResponsePromise()) ?? null
    } catch {
      return null
    }
  }

  function resetTurnstile() {
    turnstileRef.current?.reset()
    setHasTurnstileToken(false)
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

  async function handleLoginSuccess({ loginId, name, id, lastLoginAt, lastLogoutAt }: User) {
    toast.success(`${loginId} 계정으로 로그인했어요`)
    setTwoFactorData(null)
    setPkceChallenge(null)

    if (id) {
      identify(id)
      track('login', { loginId, lastLoginAt, lastLogoutAt })
    }

    const me = await queryClient.fetchQuery({ ...getMeQueryFetchOptions(), staleTime: 0 })
    const localHistory = getLocalReadingHistoryArray()

    if (localHistory.length > 0 && isAdultVerified(me)) {
      await migrateReadingHistory({ localHistories: localHistory }).catch(() => undefined)
    }

    const params = new URLSearchParams(window.location.search)
    const redirect = params.get(SearchParamKey.REDIRECT)
    const sanitizedURL = sanitizeRedirect(redirect) || '/'
    const redirectURL = sanitizedURL.replace(/^\/@(?=\/|$|\?)/, `/@${name}`)
    router.replace(redirectURL)
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()

    const form = e.currentTarget
    const formData = new FormData(form)
    clearLoginValidity(form)

    if (!form.reportValidity()) {
      return
    }

    const turnstileToken = await getTurnstileToken()

    if (!turnstileToken) {
      resetTurnstile()
      toast.warning('Cloudflare 보안 검증을 완료해 주세요')
      return
    }

    const [pkceChallenge, fingerprint] = await Promise.all([
      generatePKCEChallenge(),
      FingerprintJS.load().then((fp) => fp.get()),
    ])

    setPkceChallenge(pkceChallenge)

    submitLogin({
      loginId: String(formData.get('login-id') ?? ''),
      password: String(formData.get('password') ?? ''),
      remember: formData.get('remember') === 'on',
      turnstileToken,
      codeChallenge: pkceChallenge.codeChallenge,
      fingerprint: fingerprint.visitorId,
    })
  }

  function handleFormInput(e: React.InputEvent) {
    if (e.target instanceof HTMLInputElement) {
      e.target.setCustomValidity('')
    }
  }

  return (
    <div className="grid gap-6 sm:gap-7">
      <Link className="w-fit mx-auto" href="/" prefetch={false}>
        <IconLogo className="w-9" priority />
      </Link>

      {twoFactorData && pkceChallenge ? (
        <TwoFactorVerification
          onCancel={() => {
            setTwoFactorData(null)
            setPkceChallenge(null)
            resetTurnstile()
          }}
          onSuccess={handleLoginSuccess}
          pkceChallenge={pkceChallenge}
          twoFactorData={twoFactorData}
        />
      ) : (
        <>
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">로그인</h2>
            <p className="mt-2 text-sm text-zinc-400">아이디/비밀번호 또는 패스키로 계속해요</p>
          </div>

          <form
            className="grid gap-5"
            id="login-form"
            name="login"
            onInput={handleFormInput}
            onSubmit={handleSubmit}
            ref={formRef}
          >
            <div className="grid gap-4">
              <div>
                <label className="block mb-1.5 text-sm font-medium text-zinc-300" htmlFor="login-username">
                  아이디
                </label>
                <div className="relative group">
                  <input
                    autoCapitalize="off"
                    autoComplete="username webauthn"
                    autoCorrect="off"
                    autoFocus
                    className={twMerge(
                      'w-full rounded-xl bg-white/4 border border-white/7 pl-3 pr-10 py-2.5 text-zinc-50 placeholder:text-zinc-500 transition',
                      'focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent',
                      'disabled:opacity-60 disabled:cursor-not-allowed',
                      'user-invalid:border-red-600/50 user-invalid:focus:ring-red-600/30',
                    )}
                    disabled={isPending}
                    enterKeyHint="next"
                    id="login-username"
                    maxLength={32}
                    minLength={2}
                    name="login-id"
                    pattern={LOGIN_ID_PATTERN}
                    placeholder="아이디"
                    required
                    spellCheck={false}
                    type="text"
                  />
                  <button
                    aria-label="아이디 지우기"
                    className={twMerge(
                      'absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 bg-white/5 border border-white/7 text-zinc-400 hover:text-zinc-200 hover:bg-white/7 transition',
                      'opacity-0 pointer-events-none',
                      'group-has-[input:focus:not(:placeholder-shown)]:opacity-100 group-has-[input:focus:not(:placeholder-shown)]:pointer-events-auto',
                      'disabled:opacity-50 disabled:pointer-events-none',
                    )}
                    disabled={isPending}
                    onClick={() => clearLoginId(formRef.current)}
                    onMouseDown={(e) => e.preventDefault()}
                    tabIndex={-1}
                    type="button"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <label className="block mb-1.5 text-sm font-medium text-zinc-300" htmlFor="login-current-password">
                  비밀번호
                </label>
                <div className="relative group">
                  <input
                    autoCapitalize="off"
                    autoComplete="current-password"
                    autoCorrect="off"
                    className={twMerge(
                      'w-full rounded-xl bg-white/4 border border-white/7 pl-3 pr-10 py-2.5 text-zinc-50 placeholder:text-zinc-500 transition',
                      'focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent',
                      'disabled:opacity-60 disabled:cursor-not-allowed',
                      'user-invalid:border-red-600/50 user-invalid:focus:ring-red-600/30',
                    )}
                    disabled={isPending}
                    enterKeyHint="done"
                    id="login-current-password"
                    maxLength={64}
                    minLength={8}
                    name="password"
                    pattern={PASSWORD_PATTERN}
                    placeholder="비밀번호"
                    ref={passwordInputRef}
                    required
                    spellCheck={false}
                    type="password"
                  />
                  <button
                    aria-label="비밀번호 표시"
                    className={twMerge(
                      'absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 bg-white/5 border border-white/7 text-zinc-400 hover:text-zinc-200 hover:bg-white/7 transition',
                      'opacity-0 pointer-events-none',
                      'group-has-[input:focus:not(:placeholder-shown)]:opacity-100 group-has-[input:focus:not(:placeholder-shown)]:pointer-events-auto',
                      'aria-pressed:[&_.eye-icon]:hidden aria-pressed:[&_.eye-off-icon]:block',
                      'disabled:opacity-50 disabled:pointer-events-none',
                    )}
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
              </div>

              <div className="flex justify-end">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-zinc-400 select-none cursor-pointer" htmlFor="remember">
                    로그인 유지
                  </label>
                  <Toggle
                    aria-label="로그인 유지"
                    className={twMerge(
                      'w-10 bg-white/6 border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.28)] after:bg-white after:border-white/20 transition',
                      'peer-checked:bg-brand/65 peer-checked:border-transparent',
                      'peer-checked:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.18)]',
                      'peer-focus-visible:ring-white/20 peer-focus-visible:ring-offset-0',
                    )}
                    disabled={isPending}
                    id="remember"
                    name="remember"
                  />
                </div>
              </div>
            </div>

            <button
              className={twMerge(
                'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/7 bg-white/5 px-4 py-3 text-sm font-medium text-white/90',
                'shadow-[inset_0_-2px_0_var(--color-brand),inset_0_1px_0_rgba(255,255,255,0.06)] transition',
                'hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15',
                'disabled:opacity-50 disabled:pointer-events-none',
              )}
              disabled={isPending || !hasTurnstileToken}
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
              formRef={formRef}
              onSuccess={handleLoginSuccess}
              turnstile={{
                getToken: getTurnstileToken,
                reset: resetTurnstile,
              }}
            />

            <TurnstileWidget
              hasToken={hasTurnstileToken}
              onTokenChange={(token) => setHasTurnstileToken(Boolean(token))}
              options={{ action: 'login' }}
              turnstileRef={turnstileRef}
            />
          </form>

          <p className="text-center flex flex-wrap gap-1 justify-center text-xs text-zinc-400">
            처음이신가요?
            <SignupLink className="underline underline-offset-4 hover:text-zinc-200 transition" prefetch={false}>
              회원가입
            </SignupLink>
          </p>
        </>
      )}
    </div>
  )
}
