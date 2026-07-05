'use client'

import { signalUnknownPasskeyCredential } from '@litomi/auth/passkey'
import { browserSupportsWebAuthnAutofill, startAuthentication } from '@simplewebauthn/browser'
import { useMutation } from '@tanstack/react-query'
import { Fingerprint, Loader2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type RefObject, useEffect, useEffectEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'
import { requestPasskeyAuthenticationOptions, verifyPasskeyAuthentication } from '@/app/[locale]/auth/login/api'
import { getProblemCodeMessage } from '@/lib/error-message'
import type { ProblemDetailsError } from '@/utils/fetch-response'
import { ProblemDetailsError as ProblemDetailsErrorClass } from '@/utils/fetch-response'

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
  const [supportsAutofill, setSupportsAutofill] = useState(false)
  const lastCredentialIdRef = useRef<string | null>(null)
  const t = useTranslations('Auth.loginButton')
  const tErrors = useTranslations('Errors')

  const { mutate: verifyPasskey, isPending } = useMutation({
    mutationFn: verifyPasskeyAuthentication,
    onError: (error: ProblemDetailsError) => {
      turnstile.reset()

      if (error.status === 404 && lastCredentialIdRef.current) {
        signalUnknownPasskeyCredential(lastCredentialIdRef.current)
        return
      }

      if (!PASSKEY_LOCAL_ERROR_STATUSES.includes(error.status)) {
        return
      }

      toast.warning(getProblemCodeMessage(tErrors, error.problem) ?? t('error.verificationFailed'))
    },
    onSuccess,
    meta: { suppressGlobalErrorToastForStatuses: PASSKEY_LOCAL_ERROR_STATUSES },
  })

  async function getTurnstileTokenForLogin(isAutofill: boolean) {
    const turnstileToken = await turnstile.getToken()

    if (turnstileToken) {
      return turnstileToken
    }

    turnstile.reset()

    if (!isAutofill) {
      toast.warning(t('error.turnstileRequired'))
    }
  }

  async function getPasskeyOptionsForLogin(isAutofill: boolean) {
    try {
      const response = await requestPasskeyAuthenticationOptions()

      if (isAutofill && response.turnstileRequired) {
        return null
      }

      return response
    } catch (error) {
      if (isAutofill) {
        return null
      }

      if (error instanceof ProblemDetailsErrorClass) {
        if (error.status >= 500) {
          toast.error(t('error.authError'))
        } else {
          toast.warning(getProblemCodeMessage(tErrors, error.problem) ?? t('error.startFailed'))
        }

        return null
      }

      toast.error(t('error.authError'))
      return null
    }
  }

  async function runPasskeyLogin(mode: 'autofill' | 'button') {
    const isAutofill = mode === 'autofill'
    const passkeyOptions = await getPasskeyOptionsForLogin(isAutofill)

    if (!passkeyOptions) {
      return
    }

    const { options, turnstileRequired } = passkeyOptions

    try {
      const authResponse = await startAuthentication({
        optionsJSON: options,
        ...(isAutofill && { useBrowserAutofill: true }),
      })

      lastCredentialIdRef.current = authResponse.id
      const remember = isRememberEnabled(formRef)

      if (!turnstileRequired) {
        verifyPasskey({ authentication: authResponse, remember })
        return
      }

      const turnstileToken = await getTurnstileTokenForLogin(isAutofill)

      if (!turnstileToken) {
        return
      }

      verifyPasskey({ authentication: authResponse, remember, turnstileToken })
    } catch (error) {
      if (isAutofill) {
        return
      }

      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.warning(t('error.canceled'))
        } else if (error.name === 'NotSupportedError') {
          toast.warning(t('error.unsupported'))
        } else {
          toast.error(t('error.authError'))
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
    if (!supportsAutofill || disabled) {
      return
    }

    beginAutofillPasskeyLogin()
  }, [disabled, supportsAutofill])

  return (
    <button
      className={twMerge(
        'inline-flex items-center justify-center gap-2 rounded-xl border border-white/7 bg-white/4 px-4 py-3 text-sm font-medium text-white/80 transition',
        'hover:bg-white/6 hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15',
        'disabled:opacity-50',
      )}
      disabled={disabled || isPending}
      onClick={() => runPasskeyLogin('button')}
      title={t('passkey')}
      type="button"
    >
      {isPending ? <Loader2 className="size-5 shrink-0 animate-spin" /> : <Fingerprint className="size-5 shrink-0" />}
      <span>{t('passkey')}</span>
    </button>
  )
}

function isRememberEnabled(formRef: RefObject<HTMLFormElement | null>) {
  const rememberInput = formRef.current?.elements.namedItem('remember')
  return rememberInput instanceof HTMLInputElement && rememberInput.checked
}

const PASSKEY_LOCAL_ERROR_STATUSES = [400, 404]
