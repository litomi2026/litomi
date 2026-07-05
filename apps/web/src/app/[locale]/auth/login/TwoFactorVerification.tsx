'use client'

import type { PKCEChallenge } from '@litomi/auth/pkce-browser'
import { BACKUP_CODE_PATTERN } from '@litomi/domain/auth/policy'
import { Toggle } from '@litomi/ui'
import { useMutation } from '@tanstack/react-query'
import { Key, Loader2, RectangleEllipsis } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type SubmitEvent, useRef, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'
import OneTimeCodeInput from '@/app/[locale]/(navigation)/(right-aside)/settings/two-factor/components/OneTimeCodeInput'
import { applyInvalidParams } from '@/lib/apply-invalid-params'
import { getProblemCodeMessage } from '@/lib/error-message'
import type { ProblemDetailsError } from '@/utils/fetch-response'

import { verifyTwoFactorLogin } from './api'
import { clearTwoFactorValidity, twoFactorInputNames } from './util'

const TWO_FACTOR_LOCAL_ERROR_STATUSES = [400, 401]

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
  const formRef = useRef<HTMLFormElement>(null)
  const t = useTranslations('Auth.twoFactor')
  const tErrors = useTranslations('Errors')

  const { mutate: submitTwoFactor, isPending } = useMutation({
    mutationFn: verifyTwoFactorLogin,
    onError: (error: ProblemDetailsError) => {
      clearTwoFactorValidity(formRef.current)

      window.requestAnimationFrame(() => {
        const form = formRef.current

        if (applyInvalidParams(form, error.problem, tErrors, twoFactorInputNames)) {
          return
        }

        if (!TWO_FACTOR_LOCAL_ERROR_STATUSES.includes(error.status)) {
          return
        }

        toast.warning(getProblemCodeMessage(tErrors, error.problem) ?? t('fallbackError'))
      })
    },
    onSuccess: (data) => {
      if (data.isBackupCode) {
        if (data.backupCodeCount > 0) {
          toast.info(t('backupCodeRemaining', { count: data.backupCodeCount }))
        } else {
          toast.warning(t('backupCodeUsedUp'))
        }
      }

      onSuccess(data)
    },
    meta: { suppressGlobalErrorToastForStatuses: TWO_FACTOR_LOCAL_ERROR_STATUSES },
  })

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    clearTwoFactorValidity(e.currentTarget)

    if (!e.currentTarget.reportValidity()) {
      return
    }

    const formData = new FormData(e.currentTarget)

    submitTwoFactor({
      authorizationCode: twoFactorData.authorizationCode,
      codeVerifier: pkceChallenge.codeVerifier,
      fingerprint: twoFactorData.fingerprint,
      remember: twoFactorData.remember,
      token: String(formData.get('token') ?? ''),
      trustBrowser: formData.get('trust-browser') === 'on',
    })
  }

  function handleFormInput(e: React.InputEvent) {
    if (e.target instanceof HTMLInputElement) {
      e.target.setCustomValidity('')
    }
  }

  return (
    <div className="grid gap-6">
      <div className="text-center">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-white/4 border border-white/7 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
          <RectangleEllipsis className="size-6 text-zinc-200" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">{t('title')}</h2>
        <p className="mt-2 text-sm text-zinc-400">
          {isBackupCode ? t('backupCodeDescription') : t('appCodeDescription')}
        </p>
      </div>

      <form
        className="grid gap-5"
        id="two-factor-form"
        name="two-factor"
        onInput={handleFormInput}
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <div>
          <label className="sr-only" htmlFor="token">
            {t('tokenLabel')}
          </label>
          <OneTimeCodeInput
            autoCapitalize={isBackupCode ? 'characters' : 'off'}
            autoComplete={isBackupCode ? 'off' : 'one-time-code'}
            autoCorrect="off"
            autoFocus
            className={twMerge(
              'w-full rounded-xl bg-white/4 border border-white/7 px-4 py-3 text-center text-xl font-mono text-zinc-50 placeholder:text-zinc-500 transition',
              'focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent',
              'disabled:opacity-60 disabled:cursor-not-allowed',
            )}
            disabled={isPending}
            enterKeyHint="done"
            inputMode={isBackupCode ? 'text' : 'numeric'}
            maxLength={isBackupCode ? 9 : 6}
            minLength={isBackupCode ? 9 : 6}
            pattern={isBackupCode ? BACKUP_CODE_PATTERN : '[0-9]*'}
            placeholder={isBackupCode ? 'XXXX-XXXX' : '000000'}
            spellCheck={false}
          />
        </div>

        <div className="flex justify-end">
          <div
            aria-disabled={isBackupCode}
            className="flex items-center gap-2 transition aria-disabled:opacity-50"
            title={isBackupCode ? t('backupCodeTrustDisabled') : ''}
          >
            <label className="text-sm text-zinc-400 cursor-pointer" htmlFor="trust-browser">
              {t('trustBrowser')}
            </label>
            <Toggle
              aria-label={t('trustBrowserAria')}
              className={twMerge(
                'w-10 bg-white/6 border-transparent shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_0_rgba(0,0,0,0.28)] after:bg-white after:border-white/20 transition',
                'peer-checked:bg-brand/65 peer-checked:border-transparent',
                'peer-checked:shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(0,0,0,0.18)]',
                'peer-focus-visible:ring-white/20 peer-focus-visible:ring-offset-0',
              )}
              disabled={isPending || isBackupCode}
              id="trust-browser"
              name="trust-browser"
            />
          </div>
        </div>

        <button
          className={twMerge(
            'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/7 bg-white/5 px-4 py-3 text-sm font-medium text-white/90',
            'shadow-[inset_0_-2px_0_var(--color-brand),inset_0_1px_0_rgba(255,255,255,0.06)] transition',
            'hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15',
            'disabled:opacity-50',
          )}
          disabled={isPending}
          type="submit"
        >
          {isPending ? <Loader2 className="size-5 animate-spin" /> : null}
          {isPending ? t('submitting') : t('submit')}
        </button>

        <div className="flex items-center justify-between pt-1">
          <button
            className="flex items-center text-sm text-zinc-400 hover:text-zinc-200 transition"
            disabled={isPending}
            onClick={() => setIsBackupCode(!isBackupCode)}
            type="button"
          >
            <Key className="mr-1 size-4" />
            {isBackupCode ? t('useAuthCode') : t('useBackupCode')}
          </button>

          <button
            className="text-sm text-zinc-400 hover:text-zinc-200 transition"
            disabled={isPending}
            onClick={onCancel}
            type="button"
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
