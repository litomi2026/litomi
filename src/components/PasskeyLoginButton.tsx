'use client'

import { startAuthentication } from '@simplewebauthn/browser'
import { useState } from 'react'
import { toast } from 'sonner'

import {
  getAuthenticationOptions,
  verifyAuthentication,
} from '@/app/(navigation)/(right-search)/[loginId]/passkey/actions'
import IconFingerprint from '@/components/icons/IconFingerprint'

interface PasskeyLoginButtonProps {
  disabled?: boolean
  loginId: string
  onSuccess?: () => void
}

export default function PasskeyLoginButton({ loginId, disabled, onSuccess }: PasskeyLoginButtonProps) {
  const [loading, setLoading] = useState(false)

  async function handlePasskeyLogin() {
    if (!loginId) {
      toast.error('아이디를 먼저 입력해주세요')
      return
    }

    setLoading(true)

    try {
      // 1. Get authentication options from server
      const optionsResult = await getAuthenticationOptions(loginId)

      if (!optionsResult.success) {
        if (optionsResult.error === 'Too Many Requests') {
          const retryAfterMsg = optionsResult.retryAfter
            ? ` ${Math.ceil(optionsResult.retryAfter / 60)}분 후에 다시 시도해주세요.`
            : ''
          toast.error(`너무 많은 시도가 있었어요.${retryAfterMsg}`)
        } else {
          toast.error('패스키 인증을 시작할 수 없어요')
        }
        return
      }

      // 2. Use browser WebAuthn API to authenticate
      const authResponse = await startAuthentication({
        optionsJSON: optionsResult.options!,
      })

      // 3. Verify authentication with server
      const verifyResult = await verifyAuthentication(authResponse)

      if (!verifyResult.success) {
        toast.error('패스키 인증에 실패했어요')
        return
      }

      toast.success(`${verifyResult.loginId} 계정으로 로그인했어요`)
      onSuccess?.()
    } catch (error) {
      console.error('Passkey login error:', error)
      if (error instanceof Error) {
        if (error.name === 'NotAllowedError') {
          toast.error('패스키 인증이 취소되었어요')
        } else if (error.name === 'NotSupportedError') {
          toast.error('이 브라우저는 패스키를 지원하지 않아요')
        } else {
          toast.error('패스키 인증 중 오류가 발생했어요')
        }
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      className="flex items-center justify-center space-x-2 rounded-lg bg-zinc-800 px-4 py-3 text-zinc-300 transition-all hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled || loading}
      onClick={handlePasskeyLogin}
      title="패스키로 로그인"
      type="button"
    >
      <IconFingerprint className="h-5 w-5" />
      <span className="font-medium">패스키로 로그인</span>
    </button>
  )
}
