'use client'

import type { ProblemDetails } from '@litomi/http/problem-details'

import ms from 'ms'
import { useTranslations } from 'next-intl'
import type { ReactNode } from 'react'
import { toast } from 'sonner'

import { getAuthRedirectHref, getPathWithSearch } from '@/lib/auth-redirect'
import { getProblemMessage } from '@/lib/error-message'

// lib/error-message 리졸버의 컨텍스트 어댑터 — 비React 호출부가 토스트 콘텐츠로 넘기면
// Toaster(NextIntlClientProvider 내부) 트리에서 현재 로케일로 해석된다.
export function ProblemMessage({ problem }: { problem: ProblemDetails }) {
  const t = useTranslations('Errors')
  return getProblemMessage(t, problem)
}

export function showAdultVerificationRecommendedToast(message?: ReactNode) {
  toast.info(message ?? <TranslatedMessage id="Errors.toast.adultRecommended" />, {
    id: ADULT_VERIFICATION_REQUIRED_TOAST_ID,
    duration: ms('5 seconds'),
    action: createAdultVerificationToastAction(),
  })
}

export function showAdultVerificationRequiredToast(message?: ReactNode) {
  toast.warning(message ?? <TranslatedMessage id="Common.guard.adultVerificationRequired" />, {
    id: ADULT_VERIFICATION_REQUIRED_TOAST_ID,
    duration: ms('5 seconds'),
    action: createAdultVerificationToastAction(),
  })
}

export function showLiboExpansionRequiredToast(message?: ReactNode) {
  toast.warning(message ?? <TranslatedMessage id="Errors.toast.liboExpansionRequired" />, {
    id: LIBO_EXPANSION_REQUIRED_TOAST_ID,
    duration: ms('5 seconds'),
    action: {
      label: <TranslatedMessage id="Errors.toast.liboExpansionAction" />,
      onClick: createToastClickHandler({
        id: LIBO_EXPANSION_REQUIRED_TOAST_ID,
        href: '/libo/shop',
      }),
    },
  })
}

export function showLoginRequiredToast(message?: ReactNode) {
  toast.warning(message ?? <TranslatedMessage id="Common.guard.loginRequired" />, {
    id: LOGIN_REQUIRED_TOAST_ID,
    action: {
      label: <TranslatedMessage id="Common.guard.loginAction" />,
      onClick: createToastClickHandler({
        id: LOGIN_REQUIRED_TOAST_ID,
        href: getAuthRedirectHref('/auth/login', getPathWithSearch(window.location.pathname, window.location.search)),
      }),
    },
  })
}

function createAdultVerificationToastAction() {
  return {
    label: <TranslatedMessage id="Common.ads.action" />,
    onClick: createToastClickHandler({
      id: ADULT_VERIFICATION_REQUIRED_TOAST_ID,
      href: '/settings#adult',
    }),
  }
}

function createToastClickHandler({ id, href }: { id: string; href: string }) {
  return () => {
    toast.dismiss(id)
    window.location.assign(href)
  }
}

export function TranslatedMessage({ id }: { id: string }) {
  const t = useTranslations()
  return <span>{t(id)}</span>
}

const ADULT_VERIFICATION_REQUIRED_TOAST_ID = 'adult-verification-required'
const LIBO_EXPANSION_REQUIRED_TOAST_ID = 'libo-expansion-required'
const LOGIN_REQUIRED_TOAST_ID = 'login-required'
