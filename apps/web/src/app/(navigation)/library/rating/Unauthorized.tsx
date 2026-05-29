import { LockKeyhole } from 'lucide-react'
import Link from 'next/link'

import LoginButton from '@/components/LoginButton'
import StatusState from '@/components/status/StatusState'

import { LIBRARY_HEADER_SPACER_CLASS_NAME } from '../libraryHeaderLayout'

export default function Unauthorized() {
  return (
    <>
      <div aria-hidden className={LIBRARY_HEADER_SPACER_CLASS_NAME} />
      <div className="flex-1 flex items-center justify-center">
        <StatusState
          description="계정을 만들고 작품을 평가해보세요"
          icon={<LockKeyhole className="size-8" />}
          intent="loginRequired"
          title="평가 기능은 로그인이 필요해요"
        >
          <div className="flex flex-col w-full items-center gap-3">
            <LoginButton>로그인하기</LoginButton>
            <p className="text-sm text-zinc-500">
              처음이신가요?{' '}
              <Link
                className="text-zinc-300 underline hover:text-zinc-100 transition"
                href="/auth/signup"
                prefetch={false}
              >
                회원가입
              </Link>
            </p>
          </div>
        </StatusState>
      </div>
    </>
  )
}
