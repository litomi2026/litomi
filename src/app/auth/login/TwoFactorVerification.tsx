'use client'

import { Key, Loader2, RectangleEllipsis } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

import OneTimeCodeInput from '@/app/(navigation)/(right-search)/[name]/settings/two-factor/components/OneTimeCodeInput'
import Toggle from '@/components/ui/Toggle'
import { BACKUP_CODE_PATTERN } from '@/constants/policy'
import useServerAction, { getFormField } from '@/hook/useServerAction'
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
    authorizationCode: string
  }
}

export default function TwoFactorVerification({ onCancel, onSuccess, pkceChallenge, twoFactorData }: Props) {
  const [isBackupCode, setIsBackupCode] = useState(false)

  const [response, dispatchAction, isPending] = useServerAction({
    action: verifyTwoFactorLogin,
    onSuccess: (data) => {
      if (data.isBackupCode) {
        if (data.backupCodeCount > 0) {
          toast.info(`남은 복구 코드: ${data.backupCodeCount}개`)
        } else {
          toast.warning('복구 코드를 모두 사용했어요. 새로운 복구 코드를 생성해 주세요.')
        }
      }

      onSuccess(data)
    },
  })

  const defaultToken = getFormField(response, 'token')
  const defaultTrustBrowser = getFormField(response, 'trust-browser')

  return (
    <div className="grid gap-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-white/4 border border-white/7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <RectangleEllipsis className="size-6 text-zinc-200" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">2단계 인증</h2>
        <p className="mt-2 text-sm text-zinc-400">
          {isBackupCode ? '복구 코드를 입력해 주세요' : '인증 앱의 6자리 코드를 입력해 주세요'}
        </p>
      </div>

      <form action={dispatchAction} className="grid gap-5">
        <input name="code-verifier" type="hidden" value={pkceChallenge.codeVerifier} />
        <input name="fingerprint" type="hidden" value={twoFactorData.fingerprint} />
        <input name="authorization-code" type="hidden" value={twoFactorData.authorizationCode} />
        {twoFactorData.remember && <input name="remember" type="hidden" value="on" />}

        <div>
          <label className="sr-only" htmlFor="token">
            인증 코드
          </label>
          <OneTimeCodeInput
            autoFocus
            className="w-full rounded-xl bg-white/4 border border-white/7 px-4 py-3 text-center text-xl font-mono text-zinc-50 placeholder:text-zinc-500 transition
              focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent
              disabled:opacity-60 disabled:cursor-not-allowed"
            defaultValue={defaultToken}
            disabled={isPending}
            maxLength={isBackupCode ? 9 : 6}
            minLength={isBackupCode ? 9 : 6}
            pattern={isBackupCode ? BACKUP_CODE_PATTERN : '[0-9]*'}
            placeholder={isBackupCode ? 'XXXX-XXXX' : '000000'}
          />
        </div>

        <div className="flex justify-end">
          <div
            aria-disabled={isBackupCode}
            className="flex items-center gap-2 transition aria-disabled:opacity-50"
            title={isBackupCode ? '복구 코드를 사용하면 브라우저 신뢰 설정을 사용할 수 없어요' : ''}
          >
            <label className="text-sm text-zinc-400 cursor-pointer" htmlFor="trust-browser">
              이 브라우저 신뢰(30일)
            </label>
            <Toggle
              aria-label="브라우저 신뢰하기"
              className="w-10 bg-white/6 border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.28)] after:bg-white after:border-white/20 transition
                peer-checked:bg-brand/65 peer-checked:border-transparent
                peer-checked:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.18)]
                peer-focus-visible:ring-white/20 peer-focus-visible:ring-offset-0"
              defaultChecked={defaultTrustBrowser === 'on'}
              disabled={isPending || isBackupCode}
              id="trust-browser"
              name="trust-browser"
            />
          </div>
        </div>

        <button
          aria-disabled={isPending}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/7 bg-white/5 px-4 py-3 text-sm font-medium text-white/90
            shadow-[inset_0_-2px_0_var(--color-brand),inset_0_1px_0_rgba(255,255,255,0.06)] transition
            hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15
            aria-disabled:opacity-50 aria-disabled:pointer-events-none"
          disabled={isPending}
          type="submit"
        >
          {isPending ? <Loader2 className="size-5 animate-spin" /> : null}
          {isPending ? '확인 중...' : '확인'}
        </button>

        <div className="flex items-center justify-between pt-1">
          <button
            className="flex items-center text-sm text-zinc-400 hover:text-zinc-200 transition"
            disabled={isPending}
            onClick={() => setIsBackupCode(!isBackupCode)}
            type="button"
          >
            <Key className="mr-1 size-4" />
            {isBackupCode ? '인증 코드 사용' : '복구 코드 사용'}
          </button>

          <button
            className="text-sm text-zinc-400 hover:text-zinc-200 transition"
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            취소
          </button>
        </div>
      </form>
    </div>
  )
}
