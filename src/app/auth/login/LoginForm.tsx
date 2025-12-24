'use client'

import FingerprintJS from '@fingerprintjs/fingerprintjs'
import { TurnstileInstance } from '@marsidev/react-turnstile'
import { sendGAEvent } from '@next/third-parties/google'
import { useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

import { migrateReadingHistory } from '@/app/manga/[id]/actions'
import IconSpinner from '@/components/icons/IconSpinner'
import IconX from '@/components/icons/IconX'
import PasskeyLoginButton from '@/components/PasskeyLoginButton'
import { clearMigratedHistory, getLocalReadingHistory } from '@/components/ReadingHistoryMigrator'
import TurnstileWidget from '@/components/TurnstileWidget'
import { NEXT_PUBLIC_GA_ID } from '@/constants/env'
import { LOGIN_ID_PATTERN, PASSWORD_PATTERN } from '@/constants/policy'
import { QueryKeys } from '@/constants/query'
import { SearchParamKey } from '@/constants/storage'
import useServerAction, { getFieldError, getFormField } from '@/hook/useServerAction'
import amplitude from '@/lib/amplitude/lazy'
import { sanitizeRedirect } from '@/utils'
import { generatePKCEChallenge, PKCEChallenge } from '@/utils/pkce-browser'

import login from './action'
import TwoFactorVerification from './TwoFactorVerification'

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
  const turnstileRef = useRef<TurnstileInstance>(null)
  const queryClient = useQueryClient()
  const [currentLoginId, setCurrentLoginId] = useState('')
  const [turnstileToken, setTurnstileToken] = useState('')
  const [twoFactorData, setTwoFactorData] = useState<TwoFactorData | null>(null)
  const pkceChallengeRef = useRef<PKCEChallenge>(null)

  function resetId() {
    const loginIdInput = formRef.current?.loginId as HTMLInputElement
    if (!loginIdInput) return
    loginIdInput.value = ''
  }

  function resetPassword() {
    const passwordInput = formRef.current?.password as HTMLInputElement
    if (!passwordInput) return
    passwordInput.value = ''
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
      sendGAEvent('config', NEXT_PUBLIC_GA_ID, { user_id: id })
      sendGAEvent('event', 'login', { loginId, lastLoginAt, lastLogoutAt })
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

  const loginIdError = getFieldError(response, 'loginId')
  const passwordError = getFieldError(response, 'password')
  const defaultLoginId = getFormField(response, 'loginId')
  const defaultPassword = getFormField(response, 'password')
  const defaultRemember = getFormField(response, 'remember')

  async function dispatchLoginAction(formData: FormData) {
    const [pkceChallenge, fingerprint] = await Promise.all([
      generatePKCEChallenge(),
      FingerprintJS.load().then((fp) => fp.get()),
    ])

    pkceChallengeRef.current = pkceChallenge
    formData.append('codeChallenge', pkceChallenge.codeChallenge)
    formData.append('fingerprint', fingerprint.visitorId)
    dispatchAction(formData)
  }

  if (twoFactorData && pkceChallengeRef.current) {
    return (
      <TwoFactorVerification
        onCancel={() => {
          setTwoFactorData(null)
          pkceChallengeRef.current = null
          turnstileRef.current?.reset()
          setTurnstileToken('')
        }}
        onSuccess={handleLoginSuccess}
        pkceChallenge={pkceChallengeRef.current}
        twoFactorData={twoFactorData}
      />
    )
  }

  return (
    <form
      action={dispatchLoginAction}
      className="grid gap-5 
      [&_label]:block [&_label]:mb-1.5 [&_label]:text-sm [&_label]:font-medium [&_label]:text-zinc-300 [&_label]:leading-7
      [&_input]:w-full [&_input]:rounded-md [&_input]:bg-zinc-800 [&_input]:border [&_input]:border-zinc-600 
      [&_input]:px-3 [&_input]:py-2 [&_input]:placeholder-zinc-500 [&_input]:focus:outline-none [&_input]:focus:ring-2 [&_input]:focus:ring-zinc-500 
      [&_input]:focus:border-transparent [&_input]:disabled:bg-zinc-700 [&_input]:disabled:text-zinc-400 [&_input]:disabled:border-zinc-500 [&_input]:disabled:cursor-not-allowed
      [&_input]:aria-invalid:border-red-700 [&_input]:aria-invalid:focus:ring-red-700 [&_input]:aria-invalid:placeholder-red-700"
      ref={formRef}
    >
      <div
        className="grid gap-4 [&_button]:absolute [&_button]:top-1/2 [&_button]:right-2 [&_button]:-translate-y-1/2
          [&_button]:rounded-full [&_button]:p-1 [&_button]:bg-zinc-700 [&_button]:text-zinc-400 [&_button]:hover:bg-zinc-600"
      >
        <div>
          <label htmlFor="loginId">아이디</label>
          <div className="relative">
            <input
              aria-invalid={!!loginIdError}
              autoCapitalize="off"
              autoFocus
              defaultValue={defaultLoginId}
              disabled={isPending}
              id="loginId"
              maxLength={32}
              minLength={2}
              name="loginId"
              onChange={(e) => setCurrentLoginId(e.target.value)}
              pattern={LOGIN_ID_PATTERN}
              placeholder="아이디를 입력하세요"
              required
            />
            <button onClick={resetId} tabIndex={-1} type="button">
              <IconX className="w-3.5" />
            </button>
          </div>
          {loginIdError && <p className="mt-1 text-xs text-red-500">{loginIdError}</p>}
        </div>
        <div>
          <label htmlFor="password">비밀번호</label>
          <div className="relative">
            <input
              aria-invalid={!!passwordError}
              defaultValue={defaultPassword}
              disabled={isPending}
              id="password"
              maxLength={64}
              minLength={8}
              name="password"
              pattern={PASSWORD_PATTERN}
              placeholder="비밀번호를 입력하세요"
              required
              type="password"
            />
            <button onClick={resetPassword} tabIndex={-1} type="button">
              <IconX className="w-3.5" />
            </button>
          </div>
          {passwordError && <p className="mt-1 text-xs text-red-500">{passwordError}</p>}
        </div>
        <label className="flex! w-fit ml-auto items-center gap-2 cursor-pointer" htmlFor="remember">
          <input
            className="hidden peer"
            defaultChecked={defaultRemember === 'on'}
            disabled={isPending}
            id="remember"
            name="remember"
            type="checkbox"
          />
          <span className="text-sm text-zinc-400 select-none transition peer-checked:text-foreground">
            로그인 유지 (30일)
          </span>
          <div className="relative transition peer-checked:[&>span]:translate-x-full peer-checked:[&>div]:bg-brand-gradient peer-active:[&>div]:ring-2">
            <div className="w-10 h-6 bg-zinc-600 ring-zinc-500 rounded-full transition" />
            <span className="absolute left-1 top-1 w-4 h-4 bg-foreground border border-zinc-300 rounded-full transform transition" />
          </div>
        </label>
      </div>
      <button
        className="group border-2 border-brand-gradient font-medium rounded-xl focus:outline-none focus:ring-3 focus:ring-zinc-500
        disabled:border-zinc-500 disabled:pointer-events-none disabled:text-zinc-500"
        disabled={isPending || !turnstileToken}
        type="submit"
      >
        <div
          className="p-2 flex justify-center bg-zinc-900 rounded-xl hover:bg-zinc-800 transition active:bg-zinc-900 
          group-disabled:bg-zinc-800 group-disabled:cursor-not-allowed"
        >
          {isPending ? <IconSpinner className="size-6 p-0.5" /> : '로그인'}
        </div>
      </button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-zinc-700" />
        </div>
        <div className="flex justify-center text-sm">
          <span className="relative z-10 px-4 bg-zinc-900 text-zinc-500">또는</span>
        </div>
      </div>
      <PasskeyLoginButton
        disabled={isPending}
        loginId={currentLoginId}
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
  )
}
