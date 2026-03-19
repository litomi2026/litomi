'use client'

import ms from 'ms'
import Link from 'next/link'
import { toast } from 'sonner'

import LoginPageLink from '@/components/LoginPageLink'

type ToastOptions = {
  username?: string
}

export function showAdultVerificationRecommendedToast({ username }: ToastOptions = {}) {
  toast.info(
    <div className="flex flex-wrap gap-x-2 gap-y-1 items-center">
      <div>익명으로 성인인증하면 광고 없이 이용할 수 있어요</div>
      <AdultVerificationLink username={username} />
    </div>,
    { id: ADULT_VERIFICATION_RECOMMENDED_TOAST_ID, duration: ms('5 seconds') },
  )
}

export function showAdultVerificationRequiredToast({ username }: ToastOptions = {}) {
  toast.warning(
    <div className="flex flex-wrap gap-x-2 gap-y-1 items-center">
      <div>성인인증이 필요해요</div>
      <AdultVerificationLink username={username} />
    </div>,
    { id: ADULT_VERIFICATION_REQUIRED_TOAST_ID, duration: ms('5 seconds') },
  )
}

export function showLiboExpansionRequiredToast(message?: string) {
  toast.warning(
    <div className="flex flex-wrap gap-x-2 gap-y-1 items-center">
      <div>{message ?? '저장 한도에 도달했어요'}</div>
      <Link
        className="font-bold text-xs underline underline-offset-2"
        href="/libo/shop"
        onClick={() => toast.dismiss(LIBO_EXPANSION_REQUIRED_TOAST_ID)}
        prefetch={false}
      >
        리보로 확장하기
      </Link>
    </div>,
    { id: LIBO_EXPANSION_REQUIRED_TOAST_ID, duration: ms('5 seconds') },
  )
}

export function showLoginRequiredToast() {
  toast.warning(
    <div className="flex gap-2 items-center">
      <div>로그인이 필요해요</div>
      <LoginPageLink onClick={() => toast.dismiss(LOGIN_REQUIRED_TOAST_ID)}>로그인하기</LoginPageLink>
    </div>,
    { id: LOGIN_REQUIRED_TOAST_ID },
  )
}

function AdultVerificationLink({ username }: ToastOptions) {
  return (
    <>
      {username ? (
        <Link
          className="font-bold text-xs underline underline-offset-2"
          href={`/@${username}/settings#adult`}
          onClick={() => toast.dismiss(ADULT_VERIFICATION_REQUIRED_TOAST_ID)}
          prefetch={false}
        >
          익명으로 성인인증하기
        </Link>
      ) : (
        <LoginPageLink onClick={() => toast.dismiss(ADULT_VERIFICATION_REQUIRED_TOAST_ID)}>
          먼저 로그인하기
        </LoginPageLink>
      )}
    </>
  )
}

const ADULT_VERIFICATION_REQUIRED_TOAST_ID = 'adult-verification-required'
const ADULT_VERIFICATION_RECOMMENDED_TOAST_ID = 'adult-verification-recommended'
const LIBO_EXPANSION_REQUIRED_TOAST_ID = 'libo-expansion-required'
const LOGIN_REQUIRED_TOAST_ID = 'login-required'
