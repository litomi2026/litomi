'use client'

import { browserSupportsWebAuthnAutofill, startAuthentication } from '@simplewebauthn/browser'
import { Fingerprint, Loader2 } from 'lucide-react'
import { useEffect, useEffectEvent, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  getAuthenticationOptions,
  verifyAuthentication,
} from '@/app/(navigation)/(right-search)/[name]/settings/passkey/action-auth'
import useServerAction from '@/hook/useServerAction'
import { signalUnknownPasskeyCredential } from '@/utils/passkey'

type Props = {
  disabled?: boolean
  onSuccess?: (user: User) => void
  turnstile: TurnstileController
}

type TurnstileController = {
  getToken: () => Promise<string | null>
  reset: () => void
}

type User = {
  id: number
  loginId: string
  name: string
  lastLoginAt: Date | null
  lastLogoutAt: Date | null
}

export default function PasskeyLoginButton({ disabled, onSuccess, turnstile }: Props) {
  const [supportsAutofill, setSupportsAutofill] = useState<boolean | null>(null)
  const lastCredentialIdRef = useRef<string | null>(null)

  const [_, dispatchAction, isPending] = useServerAction({
    action: verifyAuthentication,
    onError: (response) => {
      turnstile.reset()

      if (response.status === 404 && lastCredentialIdRef.current) {
        signalUnknownPasskeyCredential(lastCredentialIdRef.current)
      }
    },
    onSuccess,
    shouldSetResponse: false,
  })

  async function runPasskeyLogin(mode: 'autofill' | 'button') {
    const isAutofill = mode === 'autofill'

    try {
      const turnstileToken = await turnstile.getToken()

      if (!turnstileToken) {
        turnstile.reset()

        if (!isAutofill) {
          toast.warning('Cloudflare 보안 검증을 완료해 주세요')
        }
        return
      }

      const optionsResult = await getAuthenticationOptions()

      if (!optionsResult.ok) {
        if (!isAutofill) {
          if (optionsResult.status >= 500) {
            toast.error('패스키 인증 중 오류가 발생했어요')
          } else {
            toast.warning(optionsResult.error)
          }
        }
        return
      }

      const authResponse = await startAuthentication({
        optionsJSON: optionsResult.data,
        ...(isAutofill && { useBrowserAutofill: true }),
      })

      lastCredentialIdRef.current = authResponse.id
      dispatchAction(authResponse, turnstileToken)
    } catch (error) {
      if (isAutofill) {
        return
      }

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.warning('패스키 인증이 취소됐어요')
        } else if (error.name === 'NotSupportedError') {
          toast.warning('이 브라우저는 패스키를 지원하지 않아요')
        } else {
          toast.error('패스키 인증 중 오류가 발생했어요')
        }
      }
    }
  }

  const beginAutofillPasskeyLogin = useEffectEvent(async () => {
    await runPasskeyLogin('autofill')
  })

  // NOTE: 브라우저 패스키 자동완성 지원 여부를 확인해요
  useEffect(() => {
    let active = true

    browserSupportsWebAuthnAutofill()
      .then((supported) => {
        if (active) {
          setSupportsAutofill(supported)
        }
      })
      .catch(() => {
        if (active) {
          setSupportsAutofill(false)
        }
      })

    return () => {
      active = false
    }
  }, [])

  // NOTE: 패스키 자동완성 지원 여부와 턴스타일 토큰이 준비되면 자동으로 패스키 로그인을 시도해요
  useEffect(() => {
    if (supportsAutofill !== true || disabled) {
      return
    }

    beginAutofillPasskeyLogin()
  }, [disabled, supportsAutofill])

  return (
    <button
      aria-disabled={disabled || isPending}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/7 bg-white/4 px-4 py-3 text-sm font-medium text-white/80 transition
        hover:bg-white/6 hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15
        disabled:opacity-50 disabled:pointer-events-none"
      disabled={disabled || isPending}
      onClick={() => runPasskeyLogin('button')}
      title="패스키로 로그인"
      type="button"
    >
      {isPending ? <Loader2 className="size-5 shrink-0 animate-spin" /> : <Fingerprint className="size-5 shrink-0" />}
      <span>패스키로 로그인</span>
    </button>
  )
}
