'use client'

import { Check, Copy, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import useClipboard from '@/hook/useClipboard'
import useServerAction, { getFormField } from '@/hook/useServerAction'

import type { TwoFactorSetupData } from '../types'

import { verifyAndEnableTwoFactor } from '../actions'
import OneTimeCodeInput from './OneTimeCodeInput'

interface Props {
  onSuccess: (backupcodes: string[]) => void
  setupData: TwoFactorSetupData
}

export default function TwoFactorSetup({ setupData, onSuccess }: Props) {
  const { copy, copied } = useClipboard()
  const { qrCode, secret } = setupData

  const [response, verifyAction, isVerifying] = useServerAction({
    action: verifyAndEnableTwoFactor,
    onSuccess: (backupcodes) => {
      onSuccess(backupcodes)
      toast.success('2단계 인증이 활성화됐어요')
    },
  })

  const defaultToken = getFormField(response, 'token')

  return (
    <div className="grid gap-6 py-3">
      <div>
        <h2 className="text-xl font-bold text-zinc-100 mb-2">2단계 인증 설정</h2>
        <p className="text-sm text-zinc-400">Google Authenticator, Authy 등의 인증 앱으로 QR 코드를 스캔하세요.</p>
      </div>
      <div className="rounded-lg bg-zinc-900 p-4 sm:p-6">
        <div className="flex justify-center mb-4">
          {qrCode && <img alt="2FA QR Code" className="rounded-lg bg-white" src={qrCode} />}
        </div>
        <div className="grid gap-2">
          <p className="text-xs text-zinc-500 text-center">
            QR 코드를 스캔할 수 없나요? 아래 키(시간 기준)를 복사하세요.
          </p>
          <div className="flex items-center gap-2">
            <input
              className="flex-1 w-full rounded bg-zinc-800 px-3 py-2 text-xs font-mono text-zinc-300"
              name="secret"
              readOnly
              type="text"
              value={secret}
            />
            <button className="rounded bg-zinc-800 p-2 text-zinc-400 hover:bg-zinc-700" onClick={() => copy(secret)}>
              {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            </button>
          </div>
        </div>
      </div>
      <form action={verifyAction} className="grid gap-3">
        <label className="block text-sm font-medium text-center text-zinc-300" htmlFor="token">
          인증 앱의 6자리 코드를 입력하세요
        </label>
        <OneTimeCodeInput defaultValue={defaultToken} />
        <button
          className="w-full rounded-lg bg-brand px-4 py-3 font-medium text-background hover:bg-brand/90 disabled:cursor-not-allowed disabled:opacity-50 transition"
          disabled={isVerifying}
          title={isVerifying ? '코드 확인 중' : '6자리 코드를 입력하세요'}
          type="submit"
        >
          {isVerifying ? (
            <span className="flex items-center justify-center">
              <Loader2 className="mr-2 size-5 animate-spin" />
              코드 확인 중
            </span>
          ) : (
            '활성화하기'
          )}
        </button>
      </form>
    </div>
  )
}
