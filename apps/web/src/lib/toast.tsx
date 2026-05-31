'use client'

import ms from 'ms'
import { toast } from 'sonner'

import { SearchParamKey } from '@/storage'

export function showAdultVerificationRecommendedToast(message?: string) {
  toast.info(message ?? '성인인증 시 광고가 제거돼요', {
    id: ADULT_VERIFICATION_REQUIRED_TOAST_ID,
    duration: ms('5 seconds'),
    action: createAdultVerificationToastAction(),
  })
}

export function showAdultVerificationRequiredToast(message?: string) {
  toast.warning(message ?? '성인인증이 필요해요', {
    id: ADULT_VERIFICATION_REQUIRED_TOAST_ID,
    duration: ms('5 seconds'),
    action: createAdultVerificationToastAction(),
  })
}

export function showLiboExpansionRequiredToast(message?: string) {
  toast.warning(message ?? '저장 한도에 도달했어요', {
    id: LIBO_EXPANSION_REQUIRED_TOAST_ID,
    duration: ms('5 seconds'),
    action: {
      label: '확장',
      onClick: createToastClickHandler({
        id: LIBO_EXPANSION_REQUIRED_TOAST_ID,
        href: '/libo/shop',
      }),
    },
  })
}

export function showLoginRequiredToast(message = '로그인이 필요해요') {
  toast.warning(message, {
    id: LOGIN_REQUIRED_TOAST_ID,
    action: {
      label: '로그인',
      onClick: createToastClickHandler({
        id: LOGIN_REQUIRED_TOAST_ID,
        href: getLoginHref(),
      }),
    },
  })
}

function createAdultVerificationToastAction() {
  return {
    label: '익명 성인인증',
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

function getLoginHref() {
  const currentPath = `${window.location.pathname}${window.location.search}`
  return `/auth/login?${SearchParamKey.REDIRECT}=${encodeURIComponent(currentPath)}`
}

const ADULT_VERIFICATION_REQUIRED_TOAST_ID = 'adult-verification-required'
const LIBO_EXPANSION_REQUIRED_TOAST_ID = 'libo-expansion-required'
const LOGIN_REQUIRED_TOAST_ID = 'login-required'
