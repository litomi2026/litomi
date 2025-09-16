'use client'

import { RectangleEllipsis } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import OneTimeCodeInput from '@/app/(navigation)/(right-search)/[name]/settings/two-factor/components/OneTimeCodeInput'
import IconKey from '@/components/icons/IconKey'
import IconSpinner from '@/components/icons/IconSpinner'
import Toggle from '@/components/ui/Toggle'
import useActionResponse, { getFormField } from '@/hook/useActionResponse'
import { PKCEChallenge } from '@/utils/pkce-browser'

import { verifyTwoFactorLogin } from './action-2fa'

interface Props {
  onCancel: () => void
  onSuccess: (data: {
    id: number
    loginId: string
    name: string
    lastLoginAt: Date | null
    lastLogoutAt: Date | null
  }) => void
  pkceChallenge: PKCEChallenge
  twoFactorData: {
    fingerprint: string
    remember: boolean
    sessionId: string
  }
}

export default function TwoFactorVerification({ onCancel, onSuccess, pkceChallenge, twoFactorData }: Props) {
  const [isBackupCode, setIsBackupCode] = useState(false)

  const [response, dispatchAction, isPending] = useActionResponse({
    action: verifyTwoFactorLogin,
    onSuccess: (data) => {
      if (data.isBackupCodeUsed && data.remainingBackupCodes !== undefined) {
        if (data.remainingBackupCodes > 0) {
          toast.info(`남은 백업 코드: ${data.remainingBackupCodes}개`)
        } else {
          toast.warning('모든 백업 코드를 사용했어요. 새로운 백업 코드를 생성해주세요.')
        }
      }

      onSuccess(data)
    },
  })

  const defaultToken = getFormField(response, 'token')

  return (
    <div className="flex items-center justify-center">
      <div className="w-full grid gap-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-zinc-800">
            <RectangleEllipsis className="size-8 text-zinc-300" />
          </div>
          <h1 className="text-2xl font-bold text-zinc-100">2단계 인증</h1>
          <p className="mt-2 text-sm text-zinc-400">
            {isBackupCode ? '백업 코드를 입력해주세요' : '인증 앱의 6자리 코드를 입력해주세요'}
          </p>
        </div>
        <form action={dispatchAction} className="grid gap-4">
          <input name="codeChallenge" type="hidden" value={pkceChallenge.codeChallenge} />
          <input name="fingerprint" type="hidden" value={twoFactorData.fingerprint} />
          <input name="sessionId" type="hidden" value={twoFactorData.sessionId} />
          <input defaultChecked={twoFactorData.remember} name="remember" type="hidden" />
          <div>
            <label className="sr-only" htmlFor="token">
              인증 코드
            </label>
            <OneTimeCodeInput
              autoFocus
              defaultValue={defaultToken}
              disabled={isPending}
              maxLength={isBackupCode ? 9 : 6}
              minLength={isBackupCode ? 9 : 6}
              pattern={isBackupCode ? '[0-9A-Z\\-]*' : '[0-9]*'}
              placeholder={isBackupCode ? 'XXXX-XXXX' : '000000'}
            />
          </div>
          <div className="flex justify-end">
            <label
              aria-disabled={isBackupCode}
              className="flex items-center gap-2 transition aria-disabled:opacity-50"
              title={isBackupCode ? '백업 코드를 사용하면 기기 신뢰 설정을 사용할 수 없어요' : ''}
            >
              <span className="ml-2 text-sm text-zinc-400">이 기기를 30일간 신뢰</span>
              <Toggle
                aria-label="기기 신뢰하기"
                className="w-10 peer-checked:bg-brand-end/80"
                disabled={isPending || isBackupCode}
                name="trustDevice"
              />
            </label>
          </div>
          <button
            className="flex w-full items-center justify-center rounded-lg bg-brand-end px-4 py-3 font-semibold text-background transition 
            hover:bg-brand-end/90 disabled:opacity-50"
            disabled={isPending}
            type="submit"
          >
            {isPending ? (
              <>
                <IconSpinner className="mr-2 size-5" />
                확인 중...
              </>
            ) : (
              '확인'
            )}
          </button>
          <div className="flex items-center justify-between pt-2">
            <button
              className="flex items-center text-sm text-zinc-400 hover:text-zinc-300"
              disabled={isPending}
              onClick={() => setIsBackupCode(!isBackupCode)}
              type="button"
            >
              <IconKey className="mr-1 size-4" />
              {isBackupCode ? '인증 코드 사용' : '백업 코드 사용'}
            </button>

            <button
              className="text-sm text-zinc-400 hover:text-zinc-300"
              disabled={isPending}
              onClick={onCancel}
              type="button"
            >
              취소
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
