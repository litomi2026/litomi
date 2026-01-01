'use client'

import ms from 'ms'
import { toast } from 'sonner'

import LoginPageLink from '@/components/LoginPageLink'

export const LOGIN_REQUIRED_TOAST_ID = 'login-required'
export const LOGIN_REQUIRED_TOAST_DURATION = ms('10 seconds')

export function showLoginRequiredToast() {
  toast.warning(
    <div className="flex gap-2 items-center">
      <div>로그인이 필요해요</div>
      <LoginPageLink onClick={() => toast.dismiss(LOGIN_REQUIRED_TOAST_ID)}>로그인하기</LoginPageLink>
    </div>,
    { duration: LOGIN_REQUIRED_TOAST_DURATION, id: LOGIN_REQUIRED_TOAST_ID },
  )
}
