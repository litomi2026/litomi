'use client'

import { startAuthentication } from '@simplewebauthn/browser'
import { Fingerprint, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  getAuthenticationOptions,
  verifyAuthentication,
} from '@/app/(navigation)/(right-search)/[name]/settings/passkey/action-auth'
import useServerAction from '@/hook/useServerAction'

type Props = {
  disabled?: boolean
  loginId: string
  turnstileToken: string
  onSuccess?: (user: User) => void
}

type User = {
  id: number
  loginId: string
  name: string
  lastLoginAt: Date | null
  lastLogoutAt: Date | null
}

export default function PasskeyLoginButton({ loginId, disabled, onSuccess, turnstileToken }: Props) {
  const [_, dispatchAction, isPending] = useServerAction({
    action: verifyAuthentication,
    onSuccess,
    shouldSetResponse: false,
  })

  async function handlePasskeyLogin() {
    if (!loginId) {
      toast.warning('로그인 아이디를 입력해 주세요')
      return
    }

    try {
      const optionsResult = await getAuthenticationOptions(loginId)

      if (!optionsResult.ok) {
        if (optionsResult.status >= 500) {
          toast.error('패스키 인증 중 오류가 발생했어요')
        } else {
          toast.warning(optionsResult.error)
        }
        return
      }

      const authResponse = await startAuthentication({ optionsJSON: optionsResult.data })
      dispatchAction(authResponse, turnstileToken)
    } catch (error) {
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

  return (
    <button
      aria-disabled={disabled || isPending || !turnstileToken}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/7 bg-white/4 px-4 py-3 text-sm font-medium text-white/80 transition
        hover:bg-white/6 hover:text-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15
        disabled:opacity-50 disabled:pointer-events-none"
      disabled={disabled || isPending || !turnstileToken}
      onClick={handlePasskeyLogin}
      title="패스키로 로그인"
      type="button"
    >
      {isPending ? <Loader2 className="size-5 shrink-0 animate-spin" /> : <Fingerprint className="size-5 shrink-0" />}
      <span>패스키로 로그인</span>
    </button>
  )
}
