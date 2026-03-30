'use client'

import { browserSupportsWebAuthnAutofill, startAuthentication } from '@simplewebauthn/browser'
import { Fingerprint, Loader2 } from 'lucide-react'
import { RefObject, useEffect, useEffectEvent, useRef, useState } from 'react'
import { toast } from 'sonner'

import {
  getAuthenticationOptions,
  verifyAuthentication,
} from '@/app/(navigation)/(right-search)/[name]/settings/passkey/action-auth'
import useServerAction from '@/hook/useServerAction'
import { signalUnknownPasskeyCredential } from '@/utils/passkey'

type Props = {
  disabled?: boolean
  formRef: RefObject<HTMLFormElement | null>
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

export default function PasskeyLoginButton({ disabled, formRef, onSuccess, turnstile }: Props) {
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

  async function getTurnstileTokenForLogin(isAutofill: boolean) {
    const turnstileToken = await turnstile.getToken()

    if (turnstileToken) {
      return turnstileToken
    }

    turnstile.reset()

    if (!isAutofill) {
      toast.warning('Cloudflare 보안 검증을 완료해 주세요')
    }
  }

  async function runPasskeyLogin(mode: 'autofill' | 'button') {
    const isAutofill = mode === 'autofill'

    try {
      const optionsResult = await getAuthenticationOptions()

      if (!optionsResult.ok) {
        if (isAutofill) {
          return
        }

        if (optionsResult.status >= 500) {
          toast.error('패스키 인증 중 오류가 발생했어요')
        } else {
          toast.warning(optionsResult.error)
        }

        return
      }

      const { options, turnstileRequired } = optionsResult.data

      if (isAutofill && turnstileRequired) {
        return
      }

      const authResponse = await startAuthentication({
        optionsJSON: options,
        ...(isAutofill && { useBrowserAutofill: true }),
      })

      lastCredentialIdRef.current = authResponse.id
      const remember = isRememberEnabled(formRef)

      if (!turnstileRequired) {
        dispatchAction({ authentication: authResponse, remember })
        return
      }

      const turnstileToken = await getTurnstileTokenForLogin(isAutofill)

      if (!turnstileToken) {
        return
      }

      dispatchAction({ authentication: authResponse, remember, turnstileToken })
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

  // NOTE: 패스키 자동완성은 저위험 시도에만 조용히 시도해요
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

function isRememberEnabled(formRef: RefObject<HTMLFormElement | null>) {
  const rememberInput = formRef.current?.elements.namedItem('remember')
  return rememberInput instanceof HTMLInputElement && rememberInput.checked
}
