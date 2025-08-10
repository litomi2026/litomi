'use client'

import { startAuthentication } from '@simplewebauthn/browser'
import { memo, useState } from 'react'
import { toast } from 'sonner'

import {
  getAuthenticationOptions,
  verifyAuthentication,
} from '@/app/(navigation)/(right-search)/[name]/passkey/actions'
import IconFingerprint from '@/components/icons/IconFingerprint'

type Props = {
  disabled?: boolean
  loginId: string
  onSuccess?: (user: User) => void
}

type User = {
  id: number
  loginId: string
  name: string
  lastLoginAt: Date
  lastLogoutAt?: Date | null
}

export default memo(PasskeyLoginButton)

function PasskeyLoginButton({ loginId, disabled, onSuccess }: Readonly<Props>) {
  const [loading, setLoading] = useState(false)

  async function handlePasskeyLogin() {
    if (!loginId) {
      toast.error('로그인 아이디를 입력해주세요')
      return
    }

    setLoading(true)

    try {
      const optionsResult = await getAuthenticationOptions(loginId)

      if (!optionsResult.ok) {
        toast.error(optionsResult.error)
        return
      }

      const authResponse = await startAuthentication({ optionsJSON: optionsResult.data })
      const verifyResult = await verifyAuthentication(authResponse)

      if (!verifyResult.ok) {
        toast.error(verifyResult.error)
        return
      }

      onSuccess?.(verifyResult.data)
    } catch (error) {
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
      <IconFingerprint className="w-5" />
      <span className="font-medium">패스키로 로그인</span>
    </button>
  )
}
