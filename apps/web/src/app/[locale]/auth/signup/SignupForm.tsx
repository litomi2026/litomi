'use client'

import { LOGIN_ID_PATTERN, PASSWORD_PATTERN } from '@litomi/domain/auth/policy'
import type { TurnstileInstance } from '@marsidev/react-turnstile'
import { Eye, EyeOff, Info, Loader2, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { type SubmitEvent, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { twMerge } from 'tailwind-merge'

import IconLogo from '@/components/icons/LogoLitomi'
import TurnstileWidget from '@/components/TurnstileWidget'
import { Link } from '@/i18n/navigation'
import { applyInvalidParams } from '@/lib/apply-invalid-params'
import { getAuthRedirectHref, getCurrentAuthRedirect } from '@/lib/auth-redirect'

import {
  clearSignupInputValidity,
  clearSignupLoginId,
  clearSignupValidity,
  getSignupErrorMessage,
  getSignupInput,
  reportInputValidity,
  signupInputNames,
  toggleSignupPasswordVisibility,
} from './signup-form'
import useSignupMutation, { SIGNUP_LOCAL_ERROR_STATUSES } from './useSignupMutation'

export default function SignupForm() {
  const [hasTurnstileToken, setHasTurnstileToken] = useState(false)
  const [loginHref, setLoginHref] = useState('/auth/login')
  const turnstileRef = useRef<TurnstileInstance>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const t = useTranslations('Auth.signup')
  const tErrors = useTranslations('Errors')

  function resetTurnstile() {
    turnstileRef.current?.reset()
    setHasTurnstileToken(false)
  }

  function handleTurnstileTokenChange(token: string) {
    setHasTurnstileToken(Boolean(token))
  }

  const { mutate: submitSignup, isPending } = useSignupMutation({
    onError: (error) => {
      resetTurnstile()
      clearSignupValidity(formRef.current)

      window.requestAnimationFrame(() => {
        const form = formRef.current

        if (applyInvalidParams(form, error.problem, tErrors, signupInputNames)) {
          return
        }

        if (!SIGNUP_LOCAL_ERROR_STATUSES.includes(error.status)) {
          return
        }

        toast.warning(getSignupErrorMessage(error, tErrors, t('fallbackError')))
      })
    },
  })

  function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault()
    clearSignupValidity(e.currentTarget)

    const turnstileToken = turnstileRef.current?.getResponse()

    if (!turnstileToken) {
      resetTurnstile()
      toast.warning(t('turnstileRequired'))
      return
    }

    const formData = new FormData(e.currentTarget)

    const body = {
      loginId: String(formData.get('login-id') ?? ''),
      nickname: String(formData.get('nickname') ?? ''),
      password: String(formData.get('password') ?? ''),
      passwordConfirm: String(formData.get('password-confirm') ?? ''),
      turnstileToken,
    }

    if (body.password !== body.passwordConfirm) {
      reportInputValidity(getSignupInput(e.currentTarget, 'password-confirm'), t('passwordMismatch'))
      return
    }

    if (body.loginId === body.password) {
      reportInputValidity(getSignupInput(e.currentTarget, 'password'), t('passwordSameAsLoginId'))
      return
    }

    submitSignup(body)
  }

  useEffect(() => {
    const redirect = getCurrentAuthRedirect()

    if (redirect) {
      setLoginHref(getAuthRedirectHref('/auth/login', redirect))
    }
  }, [])

  return (
    <div className="grid gap-6 sm:gap-7">
      <Link className="w-fit mx-auto" href="/" prefetch={false}>
        <IconLogo className="w-9" priority />
      </Link>

      <div className="text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-zinc-50">{t('title')}</h2>
        <p className="mt-2 text-sm text-zinc-400">{t('description')}</p>
      </div>

      <form
        className="grid gap-5"
        id="signup-form"
        name="signup"
        onInput={(e) => clearSignupInputValidity(e.currentTarget, e.target)}
        onSubmit={handleSubmit}
        ref={formRef}
      >
        <div className="grid gap-4">
          <div>
            <label className="block mb-1.5 text-sm font-medium text-zinc-300" htmlFor="signup-username">
              {t('loginId')}
            </label>
            <div className="relative group">
              <input
                aria-describedby="signup-username-help"
                autoCapitalize="off"
                autoComplete="username"
                autoCorrect="off"
                autoFocus
                className={twMerge(
                  'w-full rounded-xl bg-white/4 border border-white/7 pl-3 pr-10 py-2.5 text-zinc-50 placeholder:text-zinc-500 transition',
                  'focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  'user-invalid:border-red-600/50 user-invalid:focus:ring-red-600/30',
                )}
                disabled={isPending}
                enterKeyHint="next"
                id="signup-username"
                maxLength={32}
                minLength={2}
                name="login-id"
                pattern={LOGIN_ID_PATTERN}
                placeholder={t('loginIdPlaceholder')}
                required
                spellCheck={false}
                type="text"
              />
              <button
                aria-label={t('clearLoginId')}
                className={twMerge(
                  'absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 bg-white/5 border border-white/7 text-zinc-400 hover:text-zinc-200 hover:bg-white/7 transition',
                  'opacity-0 pointer-events-none',
                  'group-has-[input:focus:not(:placeholder-shown)]:opacity-100 group-has-[input:focus:not(:placeholder-shown)]:pointer-events-auto',
                  'disabled:opacity-50',
                )}
                disabled={isPending}
                onClick={() => clearSignupLoginId(formRef.current)}
                onMouseDown={(e) => e.preventDefault()}
                tabIndex={-1}
                type="button"
              >
                <X className="size-3.5" />
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-400" id="signup-username-help">
              {t('loginIdHelp')}
            </p>
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-zinc-300" htmlFor="signup-new-password">
              {t('password')}
            </label>
            <div className="relative group">
              <input
                aria-describedby="signup-password-help"
                autoCapitalize="off"
                autoComplete="new-password"
                autoCorrect="off"
                className={twMerge(
                  'w-full rounded-xl bg-white/4 border border-white/7 pl-3 pr-10 py-2.5 text-zinc-50 placeholder:text-zinc-500 transition',
                  'focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  'user-invalid:border-red-600/50 user-invalid:focus:ring-red-600/30',
                )}
                disabled={isPending}
                enterKeyHint="next"
                id="signup-new-password"
                maxLength={64}
                minLength={8}
                name="password"
                pattern={PASSWORD_PATTERN}
                placeholder={t('passwordPlaceholder')}
                required
                spellCheck={false}
                type="password"
              />
              <button
                aria-label={t('showPassword')}
                className={twMerge(
                  'absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 bg-white/5 border border-white/7 text-zinc-400 hover:text-zinc-200 hover:bg-white/7 transition',
                  'opacity-0 pointer-events-none',
                  'group-has-[input:focus:not(:placeholder-shown)]:opacity-100 group-has-[input:focus:not(:placeholder-shown)]:pointer-events-auto',
                  'aria-pressed:[&_.eye-icon]:hidden aria-pressed:[&_.eye-off-icon]:block',
                  'disabled:opacity-50',
                )}
                disabled={isPending}
                onClick={(e) => toggleSignupPasswordVisibility(formRef.current, 'password', e.currentTarget)}
                onMouseDown={(e) => e.preventDefault()}
                tabIndex={-1}
                type="button"
              >
                <Eye className="eye-icon size-3.5" />
                <EyeOff className="eye-off-icon size-3.5 hidden" />
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-400" id="signup-password-help">
              {t('passwordHelp')}
            </p>
          </div>

          <div>
            <label
              className="block mb-1.5 text-sm font-medium text-zinc-300"
              htmlFor="signup-new-password-confirmation"
            >
              {t('passwordConfirm')}
            </label>
            <div className="relative group">
              <input
                aria-describedby="signup-password-confirmation-help"
                autoCapitalize="off"
                autoComplete="new-password"
                autoCorrect="off"
                className={twMerge(
                  'w-full rounded-xl bg-white/4 border border-white/7 pl-3 pr-10 py-2.5 text-zinc-50 placeholder:text-zinc-500 transition',
                  'focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent',
                  'disabled:opacity-60 disabled:cursor-not-allowed',
                  'user-invalid:border-red-600/50 user-invalid:focus:ring-red-600/30',
                )}
                disabled={isPending}
                enterKeyHint="next"
                id="signup-new-password-confirmation"
                maxLength={64}
                minLength={8}
                name="password-confirm"
                placeholder={t('passwordConfirmPlaceholder')}
                required
                spellCheck={false}
                type="password"
              />
              <button
                aria-label={t('showPassword')}
                className={twMerge(
                  'absolute top-1/2 right-2 -translate-y-1/2 rounded-full p-1.5 bg-white/5 border border-white/7 text-zinc-400 hover:text-zinc-200 hover:bg-white/7 transition',
                  'opacity-0 pointer-events-none',
                  'group-has-[input:focus:not(:placeholder-shown)]:opacity-100 group-has-[input:focus:not(:placeholder-shown)]:pointer-events-auto',
                  'aria-pressed:[&_.eye-icon]:hidden aria-pressed:[&_.eye-off-icon]:block',
                  'disabled:opacity-50',
                )}
                disabled={isPending}
                onClick={(e) => toggleSignupPasswordVisibility(formRef.current, 'password-confirm', e.currentTarget)}
                onMouseDown={(e) => e.preventDefault()}
                tabIndex={-1}
                type="button"
              >
                <Eye className="eye-icon size-3.5" />
                <EyeOff className="eye-off-icon size-3.5 hidden" />
              </button>
            </div>
            <p className="mt-1 text-xs text-zinc-400" id="signup-password-confirmation-help">
              {t('passwordConfirmHelp')}
            </p>
          </div>

          <div>
            <label className="block mb-1.5 text-sm font-medium text-zinc-300" htmlFor="signup-nickname">
              {t('nickname')}
            </label>
            <input
              aria-describedby="signup-nickname-help"
              autoCapitalize="off"
              autoComplete="nickname"
              autoCorrect="off"
              className={twMerge(
                'w-full rounded-xl bg-white/4 border border-white/7 px-3 py-2.5 text-zinc-50 placeholder:text-zinc-500 transition',
                'focus:outline-none focus:ring-2 focus:ring-white/12 focus:border-transparent',
                'disabled:opacity-60 disabled:cursor-not-allowed',
                'user-invalid:border-red-600/50 user-invalid:focus:ring-red-600/30',
              )}
              disabled={isPending}
              enterKeyHint="done"
              id="signup-nickname"
              maxLength={32}
              minLength={2}
              name="nickname"
              placeholder={t('nicknamePlaceholder')}
              spellCheck={false}
              type="text"
            />
            <p className="mt-1 text-xs text-zinc-400" id="signup-nickname-help">
              {t('nicknameHelp')}
            </p>
          </div>
        </div>

        <div className="rounded-xl bg-white/4 border border-white/7 p-4">
          <div className="flex gap-3">
            <Info className="size-4 text-zinc-300/80 shrink-0 mt-0.5" />
            <div className="text-zinc-400">
              <p className="text-sm font-medium text-zinc-200 mb-1">{t('autoDeletionTitle')}</p>
              <p className="text-xs">{t('autoDeletionDescription')}</p>
            </div>
          </div>
        </div>

        <button
          className={twMerge(
            'inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/7 bg-white/5 px-4 py-3 text-sm font-medium text-white/90',
            'shadow-[inset_0_-2px_0_var(--color-brand),inset_0_1px_0_rgba(255,255,255,0.06)] transition',
            'hover:bg-white/7 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/15',
            'disabled:opacity-50',
          )}
          disabled={isPending || !hasTurnstileToken}
          type="submit"
        >
          {isPending && <Loader2 className="size-5 animate-spin" />}
          <span>{isPending ? t('submitting') : t('submit')}</span>
        </button>

        <TurnstileWidget
          hasToken={hasTurnstileToken}
          id="signup-turnstile"
          onTokenChange={handleTurnstileTokenChange}
          options={{ action: 'signup' }}
          turnstileRef={turnstileRef}
        />
      </form>

      <div className="grid gap-2 text-center text-xs text-zinc-400">
        <p className="flex flex-wrap gap-1 justify-center">
          <span>{t('termsPrefix')}</span>
          <Link
            className="underline underline-offset-4 hover:text-zinc-200 transition"
            href="/doc/terms"
            prefetch={false}
          >
            {t('termsAction')}
          </Link>
          <span>{t('termsMiddle')}</span>
          <Link
            className="underline underline-offset-4 hover:text-zinc-200 transition"
            href="/doc/privacy"
            prefetch={false}
          >
            {t('privacyAction')}
          </Link>
          <span>{t('termsSuffix')}</span>
        </p>
        <p className="flex flex-wrap gap-1 justify-center">
          <span>{t('loginPrompt')}</span>
          <Link
            className="underline underline-offset-4 hover:text-zinc-200 transition"
            href={loginHref}
            prefetch={false}
          >
            {t('loginAction')}
          </Link>
        </p>
      </div>
    </div>
  )
}
