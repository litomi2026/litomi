'use client'

import Link from 'next/link'
import { toast } from 'sonner'

import LoginPageLink from '@/components/LoginPageLink'

export const LOGIN_REQUIRED_TOAST_ID = 'login-required'

export function showLoginRequiredToast() {
  toast.warning(
    <div className="flex gap-2 items-center">
      <div>로그인이 필요해요</div>
      <LoginPageLink onClick={() => toast.dismiss(LOGIN_REQUIRED_TOAST_ID)}>로그인하기</LoginPageLink>
    </div>,
    { id: LOGIN_REQUIRED_TOAST_ID },
  )
}

export const ADULT_VERIFICATION_REQUIRED_TOAST_ID = 'adult-verification-required'

type AdultVerificationToastOptions = {
  username?: string
}

export function showAdultVerificationRequiredToast(options: AdultVerificationToastOptions = {}) {
  const settingsHref = options.username ? `/@${options.username}/settings#adult` : '/@/settings#adult'

  toast.warning(
    <div className="flex flex-wrap gap-x-2 gap-y-1 items-center">
      <div>성인인증이 필요해요</div>
      {options.username && (
        <Link
          className="font-bold text-xs underline underline-offset-2"
          href={settingsHref}
          onClick={() => toast.dismiss(ADULT_VERIFICATION_REQUIRED_TOAST_ID)}
          prefetch={false}
        >
          익명으로 성인인증하기
        </Link>
      )}
    </div>,
    { id: ADULT_VERIFICATION_REQUIRED_TOAST_ID },
  )
}
